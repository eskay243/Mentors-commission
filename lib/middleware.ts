/**
 * API middleware utilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, strictRateLimit, standardRateLimit } from './rateLimit'
import { sanitizeString, sanitizeObject } from './sanitize'

/**
 * Apply rate limiting to a request
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimiter = standardRateLimit
): Promise<NextResponse> {
  const limitResult = await rateLimiter(request)
  
  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limitResult.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': String(limitResult.remaining),
          'X-RateLimit-Reset': String(limitResult.resetTime),
        },
      }
    )
  }
  
  // Add rate limit headers to response
  const response = await handler(request)
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', String(limitResult.remaining))
  response.headers.set('X-RateLimit-Reset', String(limitResult.resetTime))
  
  return response
}

/**
 * Sanitize request body
 */
export function sanitizeRequestBody<T extends Record<string, any>>(body: T): T {
  return sanitizeObject(body)
}

/**
 * Sanitize query parameters
 */
export function sanitizeQueryParams(params: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {}
  params.forEach((value, key) => {
    sanitized[key] = sanitizeString(value)
  })
  return sanitized
}


/**
 * Rate limiting middleware for API routes
 * Uses in-memory storage (for production, consider Redis)
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

/**
 * Rate limit configuration
 */
interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
}

/**
 * Get client identifier from request
 */
function getClientId(request: Request): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  // Use IP as identifier
  return ip
}

/**
 * Clean up expired entries (runs periodically)
 */
function cleanup() {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanup, 5 * 60 * 1000)

/**
 * Rate limit middleware
 */
export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...defaultOptions, ...options }
  
  return async (request: Request): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    const clientId = getClientId(request)
    const now = Date.now()
    
    // Get or create rate limit entry
    let entry = store[clientId]
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + opts.windowMs,
      }
      store[clientId] = entry
    }
    
    // Increment count
    entry.count++
    
    // Check if limit exceeded
    const allowed = entry.count <= opts.maxRequests
    const remaining = Math.max(0, opts.maxRequests - entry.count)
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    }
  }
}

/**
 * Strict rate limit for sensitive endpoints (login, signup, etc.)
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes
})

/**
 * Standard rate limit for general API endpoints
 */
export const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
})

/**
 * Lenient rate limit for read-only endpoints
 */
export const lenientRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per 15 minutes
})


/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitize a string by removing potentially dangerous HTML/script tags
 * This is a basic sanitization - for production, consider using DOMPurify
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  // Remove data: URLs that could be used for XSS
  sanitized = sanitized.replace(/data:text\/html/gi, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  return sanitized
}

/**
 * Sanitize an object by recursively sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as T[Extract<keyof T, string>]
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key])
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item) : 
        item
      ) as T[Extract<keyof T, string>]
    }
  }
  
  return sanitized
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return sanitizeString(email).toLowerCase().trim()
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  const sanitized = sanitizeString(url).trim()
  
  // Only allow http, https protocols
  if (sanitized && !/^https?:\/\//i.test(sanitized)) {
    return ''
  }
  
  return sanitized
}

/**
 * Sanitize phone number (keep only digits, +, -, spaces, parentheses)
 */
export function sanitizePhone(phone: string): string {
  return sanitizeString(phone).replace(/[^\d+\-()\s]/g, '')
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  
  return text.replace(/[&<>"']/g, (char) => map[char])
}


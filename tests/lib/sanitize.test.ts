import { describe, it, expect } from 'vitest'
import { sanitizeString, sanitizeEmail, sanitizeUrl, sanitizePhone, escapeHtml } from '@/lib/sanitize'

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('Hello')
    expect(sanitizeString('<div>Test</div>')).toBe('Test')
  })

  it('should remove script tags', () => {
    expect(sanitizeString('<script>malicious()</script>')).toBe('')
  })

  it('should remove event handlers', () => {
    expect(sanitizeString('<div onclick="alert(1)">Test</div>')).toBe('Test')
  })

  it('should remove javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)')
  })

  it('should handle null and undefined', () => {
    expect(sanitizeString(null)).toBe('')
    expect(sanitizeString(undefined)).toBe('')
  })
})

describe('sanitizeEmail', () => {
  it('should sanitize and lowercase email', () => {
    expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
  })

  it('should remove HTML from email', () => {
    expect(sanitizeEmail('<script>test</script>user@example.com')).toBe('user@example.com')
  })
})

describe('sanitizeUrl', () => {
  it('should allow http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('should allow https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('should reject non-http URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeUrl('ftp://example.com')).toBe('')
  })
})

describe('sanitizePhone', () => {
  it('should keep only valid phone characters', () => {
    expect(sanitizePhone('+1 (234) 567-8900')).toBe('+1 (234) 567-8900')
    expect(sanitizePhone('+1234567890<script>')).toBe('+1234567890')
  })
})

describe('escapeHtml', () => {
  it('should escape HTML entities', () => {
    expect(escapeHtml('<div>Test</div>')).toBe('&lt;div&gt;Test&lt;/div&gt;')
    expect(escapeHtml('"quotes"')).toBe('&quot;quotes&quot;')
    expect(escapeHtml("'apostrophe'")).toBe('&#039;apostrophe&#039;')
  })
})


/**
 * Rate limiting utility for API routes
 * Uses in-memory storage with sliding window algorithm
 */

import { NextResponse } from 'next/server';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from './constants';

interface RateLimitEntry_t {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (per IP)
// Note: In production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry_t>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client identifier from request (IP address or forwarded IP)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Check rate limit for a client
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  clientId: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);
  
  // No existing entry or expired entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }
  
  // Existing entry within window
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit response with proper headers
 */
export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
      },
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
  return response;
}


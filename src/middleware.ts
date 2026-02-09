/**
 * Next.js Middleware for rate limiting API routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

interface RateLimitEntry_t {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This works for single-instance deployments
// For multi-instance, use Redis or similar external store
const rateLimitStore = new Map<string, RateLimitEntry_t>();

// Cleanup interval tracking
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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

function getClientIp(request: NextRequest): string {
  // Try various headers for the real IP (common proxy headers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Cloudflare
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  // Fallback to unknown (will still rate limit, just shared bucket)
  return 'unknown';
}

function checkRateLimit(clientId: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  // No existing entry or expired
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  // Check if over limit
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment and allow
  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  };
}

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);
  const { allowed, remaining, resetTime } = checkRateLimit(clientIp);

  if (!allowed) {
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

  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: '/api/:path*',
};


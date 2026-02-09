/**
 * Session management using iron-session
 * Stores database credentials securely in encrypted cookies
 * Note: Only connection config is stored in session (small size)
 * Schema is fetched on-demand to avoid cookie size limits
 */

import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { ConnectionConfig_t } from '@/types';
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/lib/utils/constants';

/**
 * Session data structure - keep minimal to fit in cookie (~4KB limit)
 */
export interface SessionData_t {
  connection: ConnectionConfig_t | null;
  connectedAt: number | null;
}

/**
 * Default session data
 */
const defaultSession: SessionData_t = {
  connection: null,
  connectedAt: null,
};

/**
 * Session options configuration
 */
function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  
  if (!password || password.length < 32) {
    throw new Error(
      'SESSION_SECRET environment variable must be set and at least 32 characters long'
    );
  }

  return {
    password,
    cookieName: SESSION_COOKIE_NAME,
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    },
  };
}

/**
 * Get the current session
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData_t>(cookieStore, getSessionOptions());
}

/**
 * Save connection to session (only stores connection config, not schema)
 */
export async function saveConnectionToSession(
  connection: ConnectionConfig_t
): Promise<void> {
  const session = await getSession();
  session.connection = connection;
  session.connectedAt = Date.now();
  await session.save();
}

/**
 * Get connection from session
 */
export async function getConnectionFromSession(): Promise<ConnectionConfig_t | null> {
  const session = await getSession();
  return session.connection ?? null;
}

/**
 * Clear session (disconnect)
 */
export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.connection = null;
  session.connectedAt = null;
  await session.save();
}

/**
 * Check if session has valid connection
 */
export async function hasValidConnection(): Promise<boolean> {
  const session = await getSession();
  if (!session.connection || !session.connectedAt) {
    return false;
  }
  
  // Check if session has expired
  const elapsed = Date.now() - session.connectedAt;
  const ttlMs = SESSION_TTL_SECONDS * 1000;
  
  return elapsed < ttlMs;
}


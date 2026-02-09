/**
 * SQL validation utilities
 * Security-focused validation to ensure only SELECT queries are executed
 */

import { AppError } from '@/lib/utils/errors';

// Dangerous SQL keywords that are not allowed
const DANGEROUS_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'CREATE',
  'ALTER',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'EXECUTE',
  'EXEC',
  'CALL',
  'INTO', // INSERT INTO, SELECT INTO
] as const;

// Patterns that might indicate SQL injection
const INJECTION_PATTERNS = [
  /;\s*(?:INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)/i,
  /--.*$/m, // SQL comments (can be used for injection)
  /\/\*[\s\S]*?\*\//, // Block comments
  /UNION\s+(?:ALL\s+)?SELECT/i, // UNION-based injection
];

/**
 * Validate that SQL is a safe SELECT query
 */
export function validateSql(sql: string): void {
  const normalizedSql = sql.trim().toUpperCase();
  
  // Must start with SELECT or WITH (for CTEs)
  if (!normalizedSql.startsWith('SELECT') && !normalizedSql.startsWith('WITH')) {
    throw new AppError(
      'Only SELECT queries are allowed for security reasons.',
      'DANGEROUS_QUERY'
    );
  }
  
  // Check for dangerous keywords
  for (const keyword of DANGEROUS_KEYWORDS) {
    // Match keyword as a whole word (not part of identifier)
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (pattern.test(sql)) {
      throw new AppError(
        `Query contains forbidden keyword: ${keyword}. Only SELECT queries are allowed.`,
        'DANGEROUS_QUERY',
        { keyword }
      );
    }
  }
  
  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sql)) {
      throw new AppError(
        'Query contains potentially dangerous patterns.',
        'DANGEROUS_QUERY'
      );
    }
  }
}

/**
 * Basic SQL syntax check (very basic - just checks structure)
 */
export function isValidSqlStructure(sql: string): boolean {
  const trimmed = sql.trim();
  
  // Must have at least SELECT and FROM (or be a simple SELECT)
  const hasSelect = /^\s*(WITH|SELECT)\b/i.test(trimmed);
  
  if (!hasSelect) return false;
  
  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of trimmed) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) return false;
  }
  
  return parenCount === 0;
}

/**
 * Sanitize SQL by removing problematic characters
 * Note: This is a basic sanitization, the main security is in validateSql
 */
export function sanitizeSql(sql: string): string {
  return sql
    .trim()
    .replace(/;+$/, '') // Remove trailing semicolons
    .replace(/\s+/g, ' '); // Normalize whitespace
}


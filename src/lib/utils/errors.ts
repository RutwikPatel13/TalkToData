/**
 * Custom error classes following Sigma's error handling patterns
 */

// Error codes using discriminated union pattern
export type ErrorCode_t =
  | 'CONNECTION_FAILED'
  | 'QUERY_TIMEOUT'
  | 'INVALID_SQL'
  | 'DANGEROUS_QUERY'
  | 'LLM_ERROR'
  | 'NO_CONNECTION'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN';

/**
 * Application error class with structured error information
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode_t,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Utility to create user-friendly error messages
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * UnreachableCaseError for exhaustive switch statements
 * Following Sigma's pattern for discriminated unions
 */
export class UnreachableCaseError extends Error {
  constructor(value: never) {
    super(`Unreachable case: ${JSON.stringify(value)}`);
    this.name = 'UnreachableCaseError';
  }
}


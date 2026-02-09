/**
 * Application constants following Sigma's naming convention (CAPITAL_CASE)
 */

// Session Configuration
export const SESSION_COOKIE_NAME = 'talktodata_session';
export const SESSION_TTL_SECONDS = 4 * 60 * 60; // 4 hours
export const SESSION_PASSWORD_MIN_LENGTH = 32;

// Query Configuration
export const QUERY_TIMEOUT_MS = 10_000; // 10 seconds
export const QUERY_MAX_ROWS = 1000;
export const QUERY_MIN_ROWS = 1;

// Rate Limiting Configuration
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
export const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

// UI Configuration
export const DEBOUNCE_DELAY_MS = 300;
export const ANIMATION_DURATION_FAST_MS = 150;
export const ANIMATION_DURATION_NORMAL_MS = 225;
export const ANIMATION_DURATION_SLOW_MS = 300;

// LLM Configuration
export const LLM_MODEL_DEFAULT = 'llama-3.3-70b-versatile';
export const LLM_MAX_TOKENS = 2048;
export const LLM_TEMPERATURE = 0.1; // Low temperature for consistent SQL generation

// Database Types (Phase 2 - all types supported)
export const DATABASE_TYPES = ['postgresql', 'mysql', 'sqlite', 'sqlserver', 'mongodb'] as const;
export type DatabaseType_t = typeof DATABASE_TYPES[number];

// All database types are now supported in Phase 2
export const SUPPORTED_DATABASE_TYPES: DatabaseType_t[] = ['postgresql', 'mysql', 'sqlite', 'sqlserver', 'mongodb'];

// Database display names and default ports
export const DATABASE_CONFIG: Record<DatabaseType_t, { name: string; defaultPort: number; icon: string }> = {
  postgresql: { name: 'PostgreSQL', defaultPort: 5432, icon: '🐘' },
  mysql: { name: 'MySQL', defaultPort: 3306, icon: '🐬' },
  sqlite: { name: 'SQLite', defaultPort: 0, icon: '📦' },
  sqlserver: { name: 'SQL Server', defaultPort: 1433, icon: '🔷' },
  mongodb: { name: 'MongoDB', defaultPort: 27017, icon: '🍃' },
};

// Demo Database Configuration
export const DEMO_DATABASES = [
  {
    id: 'sample_ecommerce',
    name: 'Sample E-commerce',
    description: 'Orders, products, and customers',
  },
  {
    id: 'sample_hr',
    name: 'Sample HR',
    description: 'Employees, departments, and salaries',
  },
] as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  EXECUTE_QUERY: { key: 'Enter', modifier: 'meta' }, // Cmd+Enter
  FORMAT_SQL: { key: 'f', modifier: 'shift+meta' }, // Cmd+Shift+F
  CLEAR_INPUT: { key: 'Escape', modifier: null },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect to database. Please check your credentials.',
  QUERY_TIMEOUT: 'Query timed out. Please try a simpler query.',
  INVALID_SQL: 'The generated SQL is invalid. Please try rephrasing your question.',
  DANGEROUS_QUERY: 'Only SELECT queries are allowed for security reasons.',
  LLM_ERROR: 'Failed to generate SQL. Please try again.',
  NO_CONNECTION: 'No database connection. Please connect first.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  CONNECT: '/api/connect',
  SCHEMA: '/api/schema',
  GENERATE: '/api/generate',
  EXECUTE: '/api/execute',
  EXPLAIN: '/api/explain',
  FIX: '/api/fix',
} as const;


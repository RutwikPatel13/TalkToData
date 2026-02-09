/**
 * Connection validation utilities using Zod
 */

import { z } from 'zod';
import { DATABASE_TYPES } from '@/lib/utils/constants';

/**
 * Connection configuration schema with database type support
 */
export const connectionConfigSchema = z.object({
  type: z.enum(DATABASE_TYPES),
  host: z.string().max(255, 'Host is too long').default(''),
  port: z
    .number()
    .int()
    .min(0, 'Port must be at least 0')
    .max(65535, 'Port must be at most 65535')
    .default(0),
  database: z
    .string()
    .min(1, 'Database name is required')
    .max(255, 'Database name is too long'),
  username: z.string().max(63, 'Username is too long').default(''),
  password: z.string().default(''),
  ssl: z.boolean().optional().default(false),
}).refine((data) => {
  // SQLite only requires database (file path)
  if (data.type === 'sqlite') {
    return true;
  }
  // Other databases require host, port, username, password
  return data.host.length > 0 && data.port > 0 && data.username.length > 0;
}, {
  message: 'Host, port, and username are required for this database type',
});

export type ConnectionConfigInput_t = z.input<typeof connectionConfigSchema>;
export type ConnectionConfigOutput_t = z.output<typeof connectionConfigSchema>;

/**
 * Validate connection configuration
 */
export function validateConnectionConfig(input: unknown): ConnectionConfigOutput_t {
  return connectionConfigSchema.parse(input);
}

/**
 * Safe parse connection configuration
 */
export function safeParseConnectionConfig(input: unknown) {
  return connectionConfigSchema.safeParse(input);
}

/**
 * Generate SQL request schema
 */
export const generateSqlRequestSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .max(1000, 'Question is too long'),
});

export type GenerateSqlRequestInput_t = z.input<typeof generateSqlRequestSchema>;

/**
 * Execute SQL request schema
 */
export const executeSqlRequestSchema = z.object({
  sql: z
    .string()
    .min(1, 'SQL query is required')
    .max(10000, 'SQL query is too long'),
});

export type ExecuteSqlRequestInput_t = z.input<typeof executeSqlRequestSchema>;


/**
 * API-related types following Sigma's naming convention (_t suffix)
 */

import { ErrorCode_t } from '@/lib/utils/errors';

/**
 * Standard API response wrapper
 */
export type ApiResponse_t<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError_t };

/**
 * API error structure
 */
export interface ApiError_t {
  code: ErrorCode_t;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Connect API request body
 */
export interface ConnectRequest_t {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

/**
 * Connect API response
 */
export interface ConnectResponse_t {
  connected: boolean;
  databaseName: string;
  serverVersion?: string;
}

/**
 * Schema API response
 */
export interface SchemaResponse_t {
  tables: Array<{
    name: string;
    schema?: string;
    columns: Array<{
      name: string;
      dataType: string;
      nullable: boolean;
      isPrimaryKey?: boolean;
    }>;
    rowCount?: number;
  }>;
}

/**
 * Generate SQL API request body
 */
export interface GenerateSqlRequest_t {
  question: string;
}

/**
 * Generate SQL API response
 */
export interface GenerateSqlResponse_t {
  sql: string;
  explanation?: string;
}

/**
 * Execute SQL API request body
 */
export interface ExecuteSqlRequest_t {
  sql: string;
}

/**
 * Execute SQL API response
 */
export interface ExecuteSqlResponse_t {
  columns: Array<{
    name: string;
    dataType: string;
  }>;
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}


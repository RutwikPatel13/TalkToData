/**
 * Query-related types following Sigma's naming convention (_t suffix)
 */

import { QueryResult_t } from './database';

/**
 * Query state using discriminated union pattern
 * This enables exhaustive type checking in switch statements
 */
export type QueryState_t =
  | { status: 'idle' }
  | { status: 'generating'; question: string }
  | { status: 'editing'; sql: string; question: string }
  | { status: 'executing'; sql: string }
  | { status: 'success'; sql: string; results: QueryResult_t; question: string }
  | { status: 'error'; sql: string; error: string; question: string };

/**
 * Query history item for Phase 2
 */
export interface QueryHistoryItem_t {
  id: string;
  question: string;
  sql: string;
  executedAt: Date;
  executionTimeMs: number;
  rowCount: number;
  success: boolean;
  error?: string;
}

/**
 * Saved query for Phase 2
 */
export interface SavedQuery_t {
  id: string;
  name: string;
  description?: string;
  question: string;
  sql: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SQL generation request
 */
export interface GenerateRequest_t {
  question: string;
  schemaContext: string;
  previousQueries?: Array<{
    question: string;
    sql: string;
  }>;
}

/**
 * SQL generation response
 */
export interface GenerateResponse_t {
  sql: string;
  explanation?: string;
  confidence?: number;
}

/**
 * Query execution request
 */
export interface ExecuteRequest_t {
  sql: string;
  maxRows?: number;
  timeoutMs?: number;
}

/**
 * Query execution response
 */
export interface ExecuteResponse_t {
  success: boolean;
  data?: QueryResult_t;
  error?: string;
}


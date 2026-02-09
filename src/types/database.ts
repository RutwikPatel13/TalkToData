/**
 * Database-related types following Sigma's naming convention (_t suffix)
 */

import { DatabaseType_t } from '@/lib/utils/constants';

/**
 * Database connection configuration
 */
export interface ConnectionConfig_t {
  type: DatabaseType_t;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

/**
 * Connection status using discriminated union
 */
export type ConnectionStatus_t = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Connection state for the context provider
 */
export interface ConnectionState_t {
  config: ConnectionConfig_t | null;
  status: ConnectionStatus_t;
  schema: Schema_t | null;
  error: string | null;
}

/**
 * Database schema representation
 */
export interface Schema_t {
  tables: Table_t[];
  views?: View_t[];
}

/**
 * Table schema
 */
export interface Table_t {
  name: string;
  schema?: string;
  columns: Column_t[];
  primaryKey?: string[];
  foreignKeys?: ForeignKey_t[];
  rowCount?: number;
}

/**
 * View schema
 */
export interface View_t {
  name: string;
  schema?: string;
  columns: Column_t[];
}

/**
 * Column definition
 */
export interface Column_t {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string | null;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: {
    table: string;
    column: string;
  };
}

/**
 * Foreign key definition
 */
export interface ForeignKey_t {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

/**
 * Database adapter interface for Phase 2 extensibility
 */
export interface DatabaseAdapter_t {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;
  getSchema(): Promise<Schema_t>;
  executeQuery(sql: string, params?: unknown[]): Promise<QueryResult_t>;
}

/**
 * Query result from database execution
 */
export interface QueryResult_t {
  columns: ColumnInfo_t[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}

/**
 * Column info in query results
 */
export interface ColumnInfo_t {
  name: string;
  dataType: string;
}


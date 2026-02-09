/**
 * Database adapter types for Phase 2 extensibility
 */

import type { Schema_t, QueryResult_t, ConnectionConfig_t } from '@/types';

/**
 * Database adapter interface - all database implementations must implement this
 */
export interface DatabaseAdapter_t {
  /** The type of database this adapter handles */
  readonly type: string;
  
  /** Connect to the database */
  connect(config: ConnectionConfig_t): Promise<void>;
  
  /** Disconnect from the database */
  disconnect(): Promise<void>;
  
  /** Test if the connection is valid */
  testConnection(): Promise<boolean>;
  
  /** Get the database schema */
  getSchema(): Promise<Schema_t>;
  
  /** Execute a query and return results */
  executeQuery(sql: string, params?: unknown[]): Promise<QueryResult_t>;
  
  /** Get a text representation of the schema for LLM context */
  getSchemaContext(): Promise<string>;
}

/**
 * Database adapter factory type
 */
export type DatabaseAdapterFactory_t = (config: ConnectionConfig_t) => DatabaseAdapter_t;

/**
 * Registry of database adapters by type
 */
export type DatabaseAdapterRegistry_t = Map<string, DatabaseAdapterFactory_t>;


/**
 * Database adapter factory - Phase 2 with all database types
 */

import type { ConnectionConfig_t } from '@/types';
import type { DatabaseAdapter_t, DatabaseAdapterRegistry_t } from './types';
import { PostgresAdapter } from './postgres';
import { MySQLAdapter } from './mysql';
import { SQLiteAdapter } from './sqlite';
import { SQLServerAdapter } from './sqlserver';
import { MongoDBAdapter } from './mongodb';
import { AppError } from '@/lib/utils/errors';
import { DatabaseType_t, SUPPORTED_DATABASE_TYPES } from '@/lib/utils/constants';

// Adapter registry with all database types
const adapterRegistry: DatabaseAdapterRegistry_t = new Map();

// Register all database adapters
adapterRegistry.set('postgresql', () => new PostgresAdapter());
adapterRegistry.set('mysql', () => new MySQLAdapter());
adapterRegistry.set('sqlite', () => new SQLiteAdapter());
adapterRegistry.set('sqlserver', () => new SQLServerAdapter());
adapterRegistry.set('mongodb', () => new MongoDBAdapter());

/**
 * Create a database adapter based on the connection type
 * Following factory pattern for Phase 2 extensibility
 */
export function createDatabaseAdapter(config: ConnectionConfig_t): DatabaseAdapter_t {
  const factory = adapterRegistry.get(config.type);
  
  if (!factory) {
    throw new AppError(
      `Unsupported database type: ${config.type}. Supported types: ${SUPPORTED_DATABASE_TYPES.join(', ')}`,
      'CONNECTION_FAILED'
    );
  }
  
  return factory(config);
}

/**
 * Register a new database adapter
 * Used in Phase 2 to add MySQL, SQLite, etc.
 */
export function registerDatabaseAdapter(
  type: DatabaseType_t,
  factory: () => DatabaseAdapter_t
): void {
  adapterRegistry.set(type, factory);
}

/**
 * Check if a database type is supported
 */
export function isDatabaseTypeSupported(type: string): type is DatabaseType_t {
  return SUPPORTED_DATABASE_TYPES.includes(type as DatabaseType_t);
}

export type { DatabaseAdapter_t } from './types';
export { PostgresAdapter } from './postgres';
export { MySQLAdapter } from './mysql';
export { SQLiteAdapter } from './sqlite';
export { SQLServerAdapter } from './sqlserver';
export { MongoDBAdapter } from './mongodb';


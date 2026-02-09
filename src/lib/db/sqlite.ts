/**
 * SQLite database adapter implementation
 * Uses better-sqlite3 (synchronous API)
 */

import Database from 'better-sqlite3';
import type { Database as SQLiteDatabase } from 'better-sqlite3';
import type { Schema_t, QueryResult_t, ConnectionConfig_t, Table_t, Column_t } from '@/types';
import type { DatabaseAdapter_t } from './types';
import { AppError } from '@/lib/utils/errors';
import { QUERY_MAX_ROWS } from '@/lib/utils/constants';

export class SQLiteAdapter implements DatabaseAdapter_t {
  readonly type = 'sqlite';
  private db: SQLiteDatabase | null = null;
  private schema: Schema_t | null = null;

  async connect(config: ConnectionConfig_t): Promise<void> {
    try {
      // For SQLite, the 'database' field contains the file path
      // Use ':memory:' for in-memory database
      const filePath = config.database || ':memory:';
      this.db = new Database(filePath, { readonly: true });
      
      const connected = await this.testConnection();
      if (!connected) {
        throw new AppError('Failed to connect to SQLite database', 'CONNECTION_FAILED');
      }
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to open SQLite database',
        'CONNECTION_FAILED'
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.schema = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }

  async getSchema(): Promise<Schema_t> {
    if (this.schema) return this.schema;
    if (!this.db) throw new AppError('Not connected to database', 'NO_CONNECTION');

    // Get all tables from sqlite_master
    const tablesQuery = `
      SELECT name as table_name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    const tablesResult = this.db.prepare(tablesQuery).all() as { table_name: string }[];

    const tables: Table_t[] = tablesResult.map((row) => {
      // Get column info using PRAGMA
      const columnsResult = this.db!.prepare(`PRAGMA table_info("${row.table_name}")`).all() as {
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
        pk: number;
      }[];

      // Get row count
      const countResult = this.db!.prepare(`SELECT COUNT(*) as count FROM "${row.table_name}"`).get() as { count: number };

      const columns: Column_t[] = columnsResult.map((col) => ({
        name: col.name,
        dataType: col.type || 'TEXT',
        nullable: col.notnull === 0,
        defaultValue: col.dflt_value,
        isPrimaryKey: col.pk === 1,
      }));

      return {
        name: row.table_name,
        columns,
        rowCount: countResult.count,
      };
    });

    this.schema = { tables };
    return this.schema;
  }

  async executeQuery(sql: string, params?: unknown[]): Promise<QueryResult_t> {
    if (!this.db) throw new AppError('Not connected to database', 'NO_CONNECTION');

    const startTime = Date.now();
    
    try {
      let finalSql = sql.trim();
      const isSelect = finalSql.toLowerCase().startsWith('select');
      
      if (isSelect && !finalSql.toLowerCase().includes('limit')) {
        finalSql = `${finalSql} LIMIT ${QUERY_MAX_ROWS}`;
      }

      const stmt = this.db.prepare(finalSql);
      const rows = params ? stmt.all(...params) : stmt.all();
      const executionTimeMs = Date.now() - startTime;

      // Get column info from the statement
      const columnNames = stmt.columns().map((col) => col.name);
      const columns = columnNames.map((name) => ({
        name,
        dataType: 'TEXT', // SQLite is dynamically typed
      }));

      return {
        columns,
        rows: rows as Record<string, unknown>[],
        rowCount: rows.length,
        executionTimeMs,
      };
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Query execution failed',
        'INVALID_SQL',
        { originalError: error }
      );
    }
  }

  async getSchemaContext(): Promise<string> {
    const schema = await this.getSchema();
    
    return schema.tables
      .map((table) => {
        const columnsStr = table.columns
          .map((col) => {
            let colStr = `  ${col.name} ${col.dataType}`;
            if (col.isPrimaryKey) colStr += ' PRIMARY KEY';
            if (!col.nullable) colStr += ' NOT NULL';
            return colStr;
          })
          .join('\n');
        
        return `Table: ${table.name}\n${columnsStr}`;
      })
      .join('\n\n');
  }
}


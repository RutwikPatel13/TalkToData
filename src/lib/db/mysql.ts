/**
 * MySQL database adapter implementation
 */

import mysql from 'mysql2/promise';
import type { Pool, PoolConnection, RowDataPacket, FieldPacket } from 'mysql2/promise';
import type { Schema_t, QueryResult_t, ConnectionConfig_t, Table_t, Column_t } from '@/types';
import type { DatabaseAdapter_t } from './types';
import { AppError } from '@/lib/utils/errors';
import { QUERY_MAX_ROWS } from '@/lib/utils/constants';

export class MySQLAdapter implements DatabaseAdapter_t {
  readonly type = 'mysql';
  private pool: Pool | null = null;
  private config: ConnectionConfig_t | null = null;
  private schema: Schema_t | null = null;

  async connect(config: ConnectionConfig_t): Promise<void> {
    this.config = config;
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 10000,
    });

    const connected = await this.testConnection();
    if (!connected) {
      throw new AppError('Failed to connect to MySQL database', 'CONNECTION_FAILED');
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this.schema = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.pool) return false;
    
    try {
      const connection = await this.pool.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      return true;
    } catch {
      return false;
    }
  }

  async getSchema(): Promise<Schema_t> {
    if (this.schema) return this.schema;
    if (!this.pool || !this.config) throw new AppError('Not connected to database', 'NO_CONNECTION');

    const database = this.config.database;

    const tablesQuery = `
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as row_count
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;

    const columnsQuery = `
      SELECT
        TABLE_NAME as table_name,
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        COLUMN_KEY as column_key
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `;

    const [tablesResult] = await this.pool.query<RowDataPacket[]>(tablesQuery, [database]);
    const [columnsResult] = await this.pool.query<RowDataPacket[]>(columnsQuery, [database]);

    const tables: Table_t[] = tablesResult.map((row) => {
      const tableColumns = columnsResult
        .filter((col) => col.table_name === row.table_name)
        .map((col): Column_t => ({
          name: col.column_name,
          dataType: col.data_type,
          nullable: col.is_nullable === 'YES',
          defaultValue: col.column_default,
          isPrimaryKey: col.column_key === 'PRI',
        }));

      return {
        name: row.table_name,
        columns: tableColumns,
        rowCount: row.row_count ? parseInt(row.row_count, 10) : undefined,
      };
    });

    this.schema = { tables };
    return this.schema;
  }

  async executeQuery(sql: string, params?: unknown[]): Promise<QueryResult_t> {
    if (!this.pool) throw new AppError('Not connected to database', 'NO_CONNECTION');

    const startTime = Date.now();
    
    try {
      let finalSql = sql.trim();
      const isSelect = finalSql.toLowerCase().startsWith('select');
      
      if (isSelect && !finalSql.toLowerCase().includes('limit')) {
        finalSql = `${finalSql} LIMIT ${QUERY_MAX_ROWS}`;
      }

      const [rows, fields] = await this.pool.query<RowDataPacket[]>(finalSql, params);
      const executionTimeMs = Date.now() - startTime;

      const columns = (fields as FieldPacket[]).map((field) => ({
        name: field.name,
        dataType: this.getDataTypeName(field.type),
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

  private getDataTypeName(typeId: number | undefined): string {
    // MySQL field type constants
    const typeMap: Record<number, string> = {
      0: 'decimal', 1: 'tinyint', 2: 'smallint', 3: 'int',
      4: 'float', 5: 'double', 6: 'null', 7: 'timestamp',
      8: 'bigint', 9: 'mediumint', 10: 'date', 11: 'time',
      12: 'datetime', 13: 'year', 14: 'date', 15: 'varchar',
      16: 'bit', 245: 'json', 246: 'decimal', 252: 'blob',
      253: 'varchar', 254: 'char', 255: 'geometry',
    };
    return typeMap[typeId ?? 253] || 'unknown';
  }
}


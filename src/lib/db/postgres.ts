/**
 * PostgreSQL database adapter implementation
 */

import { Pool, type PoolClient, type QueryResult } from 'pg';
import type { Schema_t, QueryResult_t, ConnectionConfig_t, Table_t, Column_t } from '@/types';
import type { DatabaseAdapter_t } from './types';
import { AppError } from '@/lib/utils/errors';
import { QUERY_MAX_ROWS, QUERY_TIMEOUT_MS } from '@/lib/utils/constants';

export class PostgresAdapter implements DatabaseAdapter_t {
  readonly type = 'postgresql';
  private pool: Pool | null = null;
  private config: ConnectionConfig_t | null = null;
  private schema: Schema_t | null = null;

  async connect(config: ConnectionConfig_t): Promise<void> {
    this.config = config;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection
    const connected = await this.testConnection();
    if (!connected) {
      throw new AppError('Failed to connect to PostgreSQL database', 'CONNECTION_FAILED');
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
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  async getSchema(): Promise<Schema_t> {
    if (this.schema) return this.schema;
    if (!this.pool) throw new AppError('Not connected to database', 'NO_CONNECTION');

    // Excluded schemas: PostgreSQL system + Supabase internal schemas
    const excludedSchemas = [
      'pg_catalog',
      'information_schema',
      'auth',
      'storage',
      'vault',
      'pgsodium',
      'pgsodium_masks',
      'realtime',
      'supabase_functions',
      'supabase_migrations',
      'extensions',
      'graphql',
      'graphql_public',
      'pgbouncer',
      'pg_toast',
      'pg_temp_1',
      'pg_toast_temp_1',
    ];

    const excludedSchemasStr = excludedSchemas.map(s => `'${s}'`).join(', ');

    const tablesQuery = `
      SELECT
        t.table_schema,
        t.table_name,
        (SELECT reltuples::bigint FROM pg_class WHERE oid = (t.table_schema || '.' || t.table_name)::regclass) as row_count
      FROM information_schema.tables t
      WHERE t.table_schema NOT IN (${excludedSchemasStr})
        AND t.table_schema NOT LIKE 'pg_%'
        AND t.table_schema NOT LIKE '\\_%%' ESCAPE '\\'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_schema, t.table_name
    `;

    const columnsQuery = `
      SELECT
        c.table_schema,
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.table_schema, ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.table_schema = pk.table_schema
          AND c.table_name = pk.table_name
          AND c.column_name = pk.column_name
      WHERE c.table_schema NOT IN (${excludedSchemasStr})
        AND c.table_schema NOT LIKE 'pg_%'
        AND c.table_schema NOT LIKE '\\_%%' ESCAPE '\\'
      ORDER BY c.table_schema, c.table_name, c.ordinal_position
    `;

    const [tablesResult, columnsResult] = await Promise.all([
      this.pool.query(tablesQuery),
      this.pool.query(columnsQuery),
    ]);

    const tables: Table_t[] = tablesResult.rows.map((row) => {
      const tableColumns = columnsResult.rows
        .filter(
          (col) =>
            col.table_schema === row.table_schema &&
            col.table_name === row.table_name
        )
        .map((col): Column_t => ({
          name: col.column_name,
          dataType: col.data_type,
          nullable: col.is_nullable === 'YES',
          defaultValue: col.column_default,
          isPrimaryKey: col.is_primary_key,
        }));

      return {
        name: row.table_name,
        schema: row.table_schema,
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
      // Add LIMIT if not present and query is SELECT
      let finalSql = sql.trim();
      const isSelect = finalSql.toLowerCase().startsWith('select');
      
      if (isSelect && !finalSql.toLowerCase().includes('limit')) {
        finalSql = `${finalSql} LIMIT ${QUERY_MAX_ROWS}`;
      }

      const result = await this.pool.query({
        text: finalSql,
        values: params,
        rowMode: 'array',
      });

      const executionTimeMs = Date.now() - startTime;

      // Get column info
      const columns = result.fields.map((field) => ({
        name: field.name,
        dataType: this.getDataTypeName(field.dataTypeID),
      }));

      // Convert rows from array to object format
      const rows = result.rows.map((row: unknown[]) => {
        const obj: Record<string, unknown> = {};
        for (const [index, column] of columns.entries()) {
          obj[column.name] = row[index];
        }
        return obj;
      });

      return {
        columns,
        rows,
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
        
        const schemaPrefix = table.schema && table.schema !== 'public' 
          ? `${table.schema}.` 
          : '';
        
        return `Table: ${schemaPrefix}${table.name}\n${columnsStr}`;
      })
      .join('\n\n');
  }

  private getDataTypeName(oid: number): string {
    // Common PostgreSQL OIDs
    const typeMap: Record<number, string> = {
      16: 'boolean',
      20: 'bigint',
      21: 'smallint',
      23: 'integer',
      25: 'text',
      700: 'real',
      701: 'double precision',
      1043: 'varchar',
      1082: 'date',
      1114: 'timestamp',
      1184: 'timestamptz',
      2950: 'uuid',
      3802: 'jsonb',
      114: 'json',
    };
    return typeMap[oid] || 'unknown';
  }
}


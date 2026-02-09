/**
 * SQL Server database adapter implementation
 */

import sql from 'mssql';
import type { ConnectionPool, IResult, IRecordSet } from 'mssql';
import type { Schema_t, QueryResult_t, ConnectionConfig_t, Table_t, Column_t } from '@/types';
import type { DatabaseAdapter_t } from './types';
import { AppError } from '@/lib/utils/errors';
import { QUERY_MAX_ROWS } from '@/lib/utils/constants';

export class SQLServerAdapter implements DatabaseAdapter_t {
  readonly type = 'sqlserver';
  private pool: ConnectionPool | null = null;
  private config: ConnectionConfig_t | null = null;
  private schema: Schema_t | null = null;

  async connect(config: ConnectionConfig_t): Promise<void> {
    this.config = config;
    
    const sqlConfig: sql.config = {
      server: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      options: {
        encrypt: config.ssl ?? false,
        trustServerCertificate: true,
        connectTimeout: 10000,
        requestTimeout: 10000,
      },
      pool: {
        max: 5,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    try {
      this.pool = await sql.connect(sqlConfig);
      
      const connected = await this.testConnection();
      if (!connected) {
        throw new AppError('Failed to connect to SQL Server database', 'CONNECTION_FAILED');
      }
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to connect to SQL Server',
        'CONNECTION_FAILED'
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
    this.schema = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.pool) return false;
    
    try {
      await this.pool.request().query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async getSchema(): Promise<Schema_t> {
    if (this.schema) return this.schema;
    if (!this.pool) throw new AppError('Not connected to database', 'NO_CONNECTION');

    const tablesQuery = `
      SELECT 
        t.TABLE_NAME as table_name,
        (SELECT SUM(p.rows) FROM sys.partitions p 
         JOIN sys.tables st ON p.object_id = st.object_id 
         WHERE st.name = t.TABLE_NAME AND p.index_id IN (0, 1)) as row_count
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE t.TABLE_TYPE = 'BASE TABLE'
        AND t.TABLE_SCHEMA = 'dbo'
      ORDER BY t.TABLE_NAME
    `;

    const columnsQuery = `
      SELECT
        c.TABLE_NAME as table_name,
        c.COLUMN_NAME as column_name,
        c.DATA_TYPE as data_type,
        c.IS_NULLABLE as is_nullable,
        c.COLUMN_DEFAULT as column_default,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as is_primary_key
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN (
        SELECT ku.TABLE_NAME, ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE c.TABLE_SCHEMA = 'dbo'
      ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION
    `;

    const tablesResult = await this.pool.request().query(tablesQuery);
    const columnsResult = await this.pool.request().query(columnsQuery);

    const tables: Table_t[] = tablesResult.recordset.map((row) => {
      const tableColumns = columnsResult.recordset
        .filter((col) => col.table_name === row.table_name)
        .map((col): Column_t => ({
          name: col.column_name,
          dataType: col.data_type,
          nullable: col.is_nullable === 'YES',
          defaultValue: col.column_default,
          isPrimaryKey: col.is_primary_key === 1,
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

  async executeQuery(sqlQuery: string, params?: unknown[]): Promise<QueryResult_t> {
    if (!this.pool) throw new AppError('Not connected to database', 'NO_CONNECTION');

    const startTime = Date.now();
    
    try {
      let finalSql = sqlQuery.trim();
      const isSelect = finalSql.toLowerCase().startsWith('select');
      
      // SQL Server uses TOP instead of LIMIT
      if (isSelect && !finalSql.toLowerCase().includes('top ')) {
        finalSql = finalSql.replace(/^select/i, `SELECT TOP ${QUERY_MAX_ROWS}`);
      }

      const result: IResult<Record<string, unknown>> = await this.pool.request().query(finalSql);
      const executionTimeMs = Date.now() - startTime;

      // Extract column information from result
      const columns = result.recordset.columns
        ? Object.keys(result.recordset.columns).map((name) => ({
            name,
            dataType: 'varchar', // SQL Server doesn't expose type name easily in mssql
          }))
        : [];

      return {
        columns,
        rows: result.recordset as Record<string, unknown>[],
        rowCount: result.recordset.length,
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


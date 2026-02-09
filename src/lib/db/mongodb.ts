/**
 * MongoDB database adapter implementation
 * Note: MongoDB is NoSQL, so schema is inferred from sample documents
 * and queries are executed as aggregation pipelines or find operations
 */

import { MongoClient, Db, Collection, Document } from 'mongodb';
import type { Schema_t, QueryResult_t, ConnectionConfig_t, Table_t, Column_t } from '@/types';
import type { DatabaseAdapter_t } from './types';
import { AppError } from '@/lib/utils/errors';
import { QUERY_MAX_ROWS } from '@/lib/utils/constants';

export class MongoDBAdapter implements DatabaseAdapter_t {
  readonly type = 'mongodb';
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: ConnectionConfig_t | null = null;
  private schema: Schema_t | null = null;

  async connect(config: ConnectionConfig_t): Promise<void> {
    this.config = config;
    
    // Build MongoDB connection string
    // Format: mongodb://username:password@host:port/database
    const protocol = config.ssl ? 'mongodb+srv' : 'mongodb';
    const auth = config.username && config.password 
      ? `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@` 
      : '';
    const connectionString = `${protocol}://${auth}${config.host}:${config.port}/${config.database}`;
    
    try {
      this.client = new MongoClient(connectionString, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
      });
      
      await this.client.connect();
      this.db = this.client.db(config.database);
      
      const connected = await this.testConnection();
      if (!connected) {
        throw new AppError('Failed to connect to MongoDB database', 'CONNECTION_FAILED');
      }
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to connect to MongoDB',
        'CONNECTION_FAILED'
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
    this.schema = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      await this.db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async getSchema(): Promise<Schema_t> {
    if (this.schema) return this.schema;
    if (!this.db) throw new AppError('Not connected to database', 'NO_CONNECTION');

    const collections = await this.db.listCollections().toArray();
    
    const tables: Table_t[] = await Promise.all(
      collections.map(async (col) => {
        const collection = this.db!.collection(col.name);
        const count = await collection.countDocuments();
        
        // Sample a document to infer schema
        const sampleDoc = await collection.findOne();
        const columns: Column_t[] = sampleDoc 
          ? this.inferColumnsFromDocument(sampleDoc)
          : [{ name: '_id', dataType: 'ObjectId', nullable: false, isPrimaryKey: true }];

        return {
          name: col.name,
          columns,
          rowCount: count,
        };
      })
    );

    this.schema = { tables };
    return this.schema;
  }

  private inferColumnsFromDocument(doc: Document): Column_t[] {
    return Object.entries(doc).map(([key, value]) => ({
      name: key,
      dataType: this.getMongoType(value),
      nullable: value === null,
      isPrimaryKey: key === '_id',
    }));
  }

  private getMongoType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'object' && value !== null) {
      if ('$oid' in value || value.constructor?.name === 'ObjectId') return 'ObjectId';
      return 'object';
    }
    return typeof value;
  }

  async executeQuery(query: string, params?: unknown[]): Promise<QueryResult_t> {
    if (!this.db) throw new AppError('Not connected to database', 'NO_CONNECTION');

    const startTime = Date.now();
    
    try {
      // Parse the query - expect JSON format for MongoDB operations
      // Format: { "collection": "name", "operation": "find", "filter": {}, "projection": {} }
      const queryObj = JSON.parse(query);
      const { collection: colName, operation, filter, projection, pipeline } = queryObj;
      
      const collection = this.db.collection(colName);
      let rows: Document[] = [];

      if (operation === 'find') {
        rows = await collection.find(filter || {}, { projection }).limit(QUERY_MAX_ROWS).toArray();
      } else if (operation === 'aggregate') {
        rows = await collection.aggregate(pipeline || []).limit(QUERY_MAX_ROWS).toArray();
      } else {
        throw new AppError(`Unsupported operation: ${operation}`, 'INVALID_SQL');
      }

      const executionTimeMs = Date.now() - startTime;
      const columns = rows.length > 0 
        ? Object.keys(rows[0]).map(name => ({ name, dataType: 'mixed' }))
        : [];

      return {
        columns,
        rows: rows as Record<string, unknown>[],
        rowCount: rows.length,
        executionTimeMs,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AppError('Invalid MongoDB query format. Expected JSON.', 'INVALID_SQL');
      }
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
          .map((col) => `  ${col.name}: ${col.dataType}${col.isPrimaryKey ? ' (primary)' : ''}`)
          .join('\n');
        
        return `Collection: ${table.name} (${table.rowCount ?? 0} documents)\n${columnsStr}`;
      })
      .join('\n\n');
  }
}


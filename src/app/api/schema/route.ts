/**
 * Database schema API route
 * GET: Get current database schema (fetched on-demand)
 */

import { NextResponse } from 'next/server';
import { getConnectionFromSession, hasValidConnection } from '@/lib/session';
import { createDatabaseAdapter } from '@/lib/db';
import type { ApiResponse_t, SchemaResponse_t } from '@/types';

export async function GET(): Promise<NextResponse<ApiResponse_t<SchemaResponse_t>>> {
  try {
    // Check if we have a valid connection
    const isConnected = await hasValidConnection();

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_CONNECTION',
            message: 'No active database connection. Please connect first.',
          },
        },
        { status: 401 }
      );
    }

    // Get connection config from session
    const config = await getConnectionFromSession();

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_CONNECTION',
            message: 'Connection config not available. Please reconnect.',
          },
        },
        { status: 400 }
      );
    }

    // Create adapter and fetch schema on-demand
    const adapter = createDatabaseAdapter(config);
    await adapter.connect(config);

    try {
      const schema = await adapter.getSchema();

      return NextResponse.json({
        success: true,
        data: {
          tables: schema.tables.map((table) => ({
            name: table.name,
            schema: table.schema,
            columns: table.columns.map((col) => ({
              name: col.name,
              dataType: col.dataType,
              nullable: col.nullable,
              isPrimaryKey: col.isPrimaryKey,
            })),
            rowCount: table.rowCount,
          })),
        },
      });
    } finally {
      await adapter.disconnect();
    }
  } catch (error) {
    console.error('Schema fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: 'Failed to fetch schema',
        },
      },
      { status: 500 }
    );
  }
}


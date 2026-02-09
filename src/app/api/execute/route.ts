/**
 * SQL execution API route
 * POST: Execute SQL query against connected database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/db';
import { getConnectionFromSession, hasValidConnection } from '@/lib/session';
import { executeSqlRequestSchema, validateSql, sanitizeSql } from '@/lib/validators';
import type { ApiResponse_t, ExecuteSqlResponse_t } from '@/types';
import { isAppError } from '@/lib/utils/errors';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse_t<ExecuteSqlResponse_t>>> {
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
    
    // Parse and validate request
    const body = await request.json();
    const { sql: rawSql } = executeSqlRequestSchema.parse(body);
    
    // Sanitize and validate SQL
    const sql = sanitizeSql(rawSql);
    validateSql(sql); // Throws if dangerous
    
    // Get connection from session
    const config = await getConnectionFromSession();
    
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_CONNECTION',
            message: 'Connection configuration not found. Please reconnect.',
          },
        },
        { status: 400 }
      );
    }
    
    // Create adapter and execute query
    const adapter = createDatabaseAdapter(config);
    await adapter.connect(config);
    
    try {
      const result = await adapter.executeQuery(sql);
      
      return NextResponse.json({
        success: true,
        data: {
          columns: result.columns,
          rows: result.rows,
          rowCount: result.rowCount,
          executionTimeMs: result.executionTimeMs,
        },
      });
    } finally {
      await adapter.disconnect();
    }
  } catch (error) {
    console.error('SQL execution error:', error);
    
    const message = isAppError(error)
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to execute query';
    
    const code = isAppError(error) ? error.code : 'INVALID_SQL';
    
    return NextResponse.json(
      {
        success: false,
        error: { code, message },
      },
      { status: 400 }
    );
  }
}


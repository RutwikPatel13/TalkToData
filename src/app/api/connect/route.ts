/**
 * Database connection API route
 * POST: Connect to database and store credentials in session
 * DELETE: Disconnect and clear session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/db';
import { saveConnectionToSession, clearSession } from '@/lib/session';
import { validateConnectionConfig } from '@/lib/validators';
import type { ApiResponse_t, ConnectResponse_t } from '@/types';
import { isAppError } from '@/lib/utils/errors';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse_t<ConnectResponse_t>>> {
  try {
    const body = await request.json();

    // Validate input (includes database type)
    const config = validateConnectionConfig(body);

    // Create adapter based on type and connect
    const adapter = createDatabaseAdapter(config);

    await adapter.connect(config);

    // Test connection by fetching schema (but don't store it)
    await adapter.getSchema();

    // Store only connection config in session (small size fits in cookie)
    await saveConnectionToSession(config);

    // Disconnect the temporary adapter (session will be used for future queries)
    await adapter.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        databaseName: config.database,
      },
    });
  } catch (error) {
    console.error('Connection error:', error);

    const message = isAppError(error)
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to connect to database';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isAppError(error) ? error.code : 'CONNECTION_FAILED',
          message,
        },
      },
      { status: 400 }
    );
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponse_t<{ disconnected: boolean }>>> {
  try {
    await clearSession();
    
    return NextResponse.json({
      success: true,
      data: { disconnected: true },
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: 'Failed to disconnect',
        },
      },
      { status: 500 }
    );
  }
}


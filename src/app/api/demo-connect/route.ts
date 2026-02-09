/**
 * Demo database connection API route
 * POST: Connect to demo database using server-side environment variables
 * Credentials are never sent to the client
 */

import { NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/db';
import { saveConnectionToSession } from '@/lib/session';
import type { ApiResponse_t, ConnectResponse_t, ConnectionConfig_t } from '@/types';
import { isAppError } from '@/lib/utils/errors';

export async function POST(): Promise<NextResponse<ApiResponse_t<ConnectResponse_t>>> {
  try {
    // Read demo credentials from environment variables (server-side only)
    const host = process.env.DEMO_DB_HOST;
    const port = process.env.DEMO_DB_PORT;
    const database = process.env.DEMO_DB_NAME;
    const username = process.env.DEMO_DB_USER;
    const password = process.env.DEMO_DB_PASSWORD;

    // Validate all env vars are present
    if (!host || !port || !database || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'Demo database is not configured. Please contact the administrator.',
          },
        },
        { status: 500 }
      );
    }

    const config: ConnectionConfig_t = {
      type: 'postgresql',
      host,
      port: parseInt(port, 10),
      database,
      username,
      password,
      ssl: true, // Supabase requires SSL
    };

    // Create adapter and connect
    const adapter = createDatabaseAdapter(config);
    await adapter.connect(config);

    // Test connection by fetching schema
    await adapter.getSchema();

    // Store connection config in session
    await saveConnectionToSession(config);

    // Disconnect the temporary adapter
    await adapter.disconnect();

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        databaseName: database,
      },
    });
  } catch (error) {
    console.error('Demo connection error:', error);

    const message = isAppError(error)
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to connect to demo database';

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


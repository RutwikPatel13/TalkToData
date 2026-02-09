/**
 * Session status API route
 * GET: Check if there's a valid session and return connection info
 */

import { NextResponse } from 'next/server';
import { getConnectionFromSession, hasValidConnection } from '@/lib/session';
import { createDatabaseAdapter } from '@/lib/db';
import type { ApiResponse_t, Schema_t } from '@/types';

interface SessionStatusResponse_t {
  connected: boolean;
  databaseName?: string;
  databaseType?: string;
  schema?: Schema_t;
}

export async function GET(): Promise<NextResponse<ApiResponse_t<SessionStatusResponse_t>>> {
  try {
    const hasConnection = await hasValidConnection();
    
    if (!hasConnection) {
      return NextResponse.json({
        success: true,
        data: { connected: false },
      });
    }

    const config = await getConnectionFromSession();
    
    if (!config) {
      return NextResponse.json({
        success: true,
        data: { connected: false },
      });
    }

    // Try to reconnect and fetch schema to verify connection is still valid
    try {
      const adapter = createDatabaseAdapter(config);
      await adapter.connect(config);
      const schema = await adapter.getSchema();
      await adapter.disconnect();

      return NextResponse.json({
        success: true,
        data: {
          connected: true,
          databaseName: config.database,
          databaseType: config.type,
          schema,
        },
      });
    } catch {
      // Connection failed, session is stale
      return NextResponse.json({
        success: true,
        data: { connected: false },
      });
    }
  } catch (error) {
    console.error('Session check error:', error);
    
    return NextResponse.json({
      success: true,
      data: { connected: false },
    });
  }
}


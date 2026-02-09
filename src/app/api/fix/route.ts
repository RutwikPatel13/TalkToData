/**
 * SQL error fix API route
 * POST: Fix a SQL query that has errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { fixSqlError, initializeLlm } from '@/lib/llm';
import { getConnectionFromSession, hasValidConnection } from '@/lib/session';
import { createDatabaseAdapter } from '@/lib/db';
import type { ApiResponse_t } from '@/types';
import { isAppError } from '@/lib/utils/errors';
import { z } from 'zod';

interface FixResponse_t {
  sql: string;
}

// Request schema
const fixRequestSchema = z.object({
  sql: z.string().min(1, 'SQL query is required').max(10000, 'SQL query is too long'),
  error: z.string().min(1, 'Error message is required').max(5000, 'Error message is too long'),
});

// Initialize LLM on first request
let llmInitialized = false;

function ensureLlmInitialized() {
  if (!llmInitialized) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    initializeLlm(apiKey);
    llmInitialized = true;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse_t<FixResponse_t>>> {
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
    const { sql, error } = fixRequestSchema.parse(body);

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

    // Create adapter and fetch schema context
    const adapter = createDatabaseAdapter(config);
    await adapter.connect(config);

    try {
      const schemaContext = await adapter.getSchemaContext();

      // Initialize LLM
      ensureLlmInitialized();

      // Fix the SQL
      const fixedSql = await fixSqlError(sql, error, schemaContext);

      return NextResponse.json({
        success: true,
        data: { sql: fixedSql },
      });
    } finally {
      await adapter.disconnect();
    }
  } catch (error) {
    console.error('SQL fix error:', error);

    const message = isAppError(error)
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to fix SQL';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isAppError(error) ? error.code : 'LLM_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}


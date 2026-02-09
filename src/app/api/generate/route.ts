/**
 * SQL generation API route
 * POST: Generate SQL from natural language question
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSql, initializeLlm } from '@/lib/llm';
import { getConnectionFromSession, hasValidConnection } from '@/lib/session';
import { createDatabaseAdapter } from '@/lib/db';
import { generateSqlRequestSchema } from '@/lib/validators';
import type { ApiResponse_t, GenerateSqlResponse_t } from '@/types';
import { isAppError } from '@/lib/utils/errors';

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

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse_t<GenerateSqlResponse_t>>> {
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
    const { question } = generateSqlRequestSchema.parse(body);

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

    // Create adapter and fetch schema context on-demand
    const adapter = createDatabaseAdapter(config);
    await adapter.connect(config);

    try {
      const schemaContext = await adapter.getSchemaContext();

      // Initialize LLM
      ensureLlmInitialized();

      // Generate SQL
      const sql = await generateSql(question, schemaContext);

      return NextResponse.json({
        success: true,
        data: { sql },
      });
    } finally {
      await adapter.disconnect();
    }
  } catch (error) {
    console.error('SQL generation error:', error);

    const message = isAppError(error)
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to generate SQL';

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


/**
 * SQL explanation API route
 * POST: Explain a SQL query in plain English
 */

import { NextRequest, NextResponse } from 'next/server';
import { explainSql, initializeLlm } from '@/lib/llm';
import { hasValidConnection } from '@/lib/session';
import { executeSqlRequestSchema } from '@/lib/validators';
import type { ApiResponse_t } from '@/types';
import { isAppError } from '@/lib/utils/errors';

interface ExplainResponse_t {
  explanation: string;
}

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

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse_t<ExplainResponse_t>>> {
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

    // Parse and validate request (reuse sql schema)
    const body = await request.json();
    const { sql } = executeSqlRequestSchema.parse(body);

    // Initialize LLM
    ensureLlmInitialized();

    // Generate explanation
    const explanation = await explainSql(sql);

    return NextResponse.json({
      success: true,
      data: { explanation },
    });
  } catch (error) {
    console.error('SQL explanation error:', error);

    const message = isAppError(error)
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to explain SQL';

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


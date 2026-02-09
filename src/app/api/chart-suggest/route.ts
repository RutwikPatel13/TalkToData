/**
 * Chart suggestion API route
 * POST: Suggest the best chart type for query results
 */

import { NextRequest, NextResponse } from 'next/server';
import { suggestChart, initializeLlm, type ChartSuggestion_t } from '@/lib/llm';
import { hasValidConnection } from '@/lib/session';
import type { ApiResponse_t } from '@/types';
import { isAppError } from '@/lib/utils/errors';
import { z } from 'zod';

// Request schema
const chartSuggestRequestSchema = z.object({
  columns: z.array(
    z.object({
      name: z.string(),
      dataType: z.string(),
    })
  ),
  sampleRows: z.array(z.record(z.string(), z.unknown())),
  rowCount: z.number(),
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

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse_t<ChartSuggestion_t>>> {
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
    const { columns, sampleRows, rowCount } = chartSuggestRequestSchema.parse(body);

    // Initialize LLM
    ensureLlmInitialized();

    // Get chart suggestion
    const suggestion = await suggestChart(columns, sampleRows, rowCount);

    return NextResponse.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    console.error('Chart suggestion error:', error);

    const message = isAppError(error)
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to suggest chart';

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


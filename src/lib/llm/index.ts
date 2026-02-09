/**
 * LLM integration module
 */

import type { LlmAdapter_t } from './types';
import { GroqAdapter, extractSql } from './groq';
import {
  SQL_GENERATION_SYSTEM_PROMPT,
  SQL_EXPLANATION_SYSTEM_PROMPT,
  SQL_ERROR_FIX_SYSTEM_PROMPT,
  CHART_SUGGESTION_SYSTEM_PROMPT,
  generateUserPrompt,
  generateExplanationPrompt,
  generateErrorFixPrompt,
  generateChartSuggestionPrompt,
} from './prompts';
import { AppError } from '@/lib/utils/errors';

// Singleton LLM adapter instance
let llmAdapter: LlmAdapter_t | null = null;

/**
 * Initialize the LLM adapter with Groq
 */
export function initializeLlm(apiKey: string): void {
  llmAdapter = new GroqAdapter(apiKey);
}

/**
 * Generate SQL from natural language question
 */
export async function generateSql(
  question: string,
  schemaContext: string
): Promise<string> {
  if (!llmAdapter) {
    throw new AppError(
      'LLM not initialized. Please set GROQ_API_KEY environment variable.',
      'LLM_ERROR'
    );
  }

  const response = await llmAdapter.complete({
    systemPrompt: SQL_GENERATION_SYSTEM_PROMPT,
    userPrompt: generateUserPrompt(question, schemaContext),
  });

  return extractSql(response.content);
}

/**
 * Explain a SQL query in plain English
 */
export async function explainSql(sql: string): Promise<string> {
  if (!llmAdapter) {
    throw new AppError(
      'LLM not initialized. Please set GROQ_API_KEY environment variable.',
      'LLM_ERROR'
    );
  }

  const response = await llmAdapter.complete({
    systemPrompt: SQL_EXPLANATION_SYSTEM_PROMPT,
    userPrompt: generateExplanationPrompt(sql),
  });

  return response.content;
}

/**
 * Fix a SQL query that has errors
 */
export async function fixSqlError(
  sql: string,
  error: string,
  schemaContext: string
): Promise<string> {
  if (!llmAdapter) {
    throw new AppError(
      'LLM not initialized. Please set GROQ_API_KEY environment variable.',
      'LLM_ERROR'
    );
  }

  const response = await llmAdapter.complete({
    systemPrompt: SQL_ERROR_FIX_SYSTEM_PROMPT,
    userPrompt: generateErrorFixPrompt(sql, error, schemaContext),
  });

  return extractSql(response.content);
}

/**
 * Chart suggestion response type
 */
export interface ChartSuggestion_t {
  chartType: 'bar' | 'line' | 'pie';
  xAxis: string;
  yAxis: string;
  explanation: string;
}

/**
 * Suggest best chart type for query results
 */
export async function suggestChart(
  columns: Array<{ name: string; dataType: string }>,
  sampleRows: Array<Record<string, unknown>>,
  rowCount: number
): Promise<ChartSuggestion_t> {
  if (!llmAdapter) {
    throw new AppError(
      'LLM not initialized. Please set GROQ_API_KEY environment variable.',
      'LLM_ERROR'
    );
  }

  const response = await llmAdapter.complete({
    systemPrompt: CHART_SUGGESTION_SYSTEM_PROMPT,
    userPrompt: generateChartSuggestionPrompt(columns, sampleRows, rowCount),
  });

  // Parse the JSON response
  try {
    let content = response.content.trim();

    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.slice(7);
    } else if (content.startsWith('```')) {
      content = content.slice(3);
    }
    if (content.endsWith('```')) {
      content = content.slice(0, -3);
    }

    const suggestion = JSON.parse(content.trim()) as ChartSuggestion_t;

    // Validate the response
    if (!['bar', 'line', 'pie'].includes(suggestion.chartType)) {
      suggestion.chartType = 'bar';
    }

    return suggestion;
  } catch {
    // Return default suggestion if parsing fails
    return {
      chartType: 'bar',
      xAxis: columns[0]?.name || '',
      yAxis: columns[1]?.name || columns[0]?.name || '',
      explanation: 'Default bar chart suggested. AI response could not be parsed.',
    };
  }
}

/**
 * Get the LLM adapter instance
 */
export function getLlmAdapter(): LlmAdapter_t | null {
  return llmAdapter;
}

export { GroqAdapter, extractSql } from './groq';
export * from './types';
export * from './prompts';


/**
 * Groq LLM adapter implementation
 */

import type { LlmAdapter_t, LlmCompletionRequest_t, LlmCompletionResponse_t } from './types';
import { AppError } from '@/lib/utils/errors';
import { LLM_MODEL_DEFAULT, LLM_MAX_TOKENS, LLM_TEMPERATURE } from '@/lib/utils/constants';

interface GroqMessage_t {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqChoice_t {
  index: number;
  message: GroqMessage_t;
  finish_reason: string;
}

interface GroqUsage_t {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GroqResponse_t {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice_t[];
  usage: GroqUsage_t;
}

export class GroqAdapter implements LlmAdapter_t {
  readonly provider = 'groq' as const;
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(apiKey: string, model: string = LLM_MODEL_DEFAULT) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async complete(request: LlmCompletionRequest_t): Promise<LlmCompletionResponse_t> {
    const messages: GroqMessage_t[] = [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userPrompt },
    ];

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: request.maxTokens ?? LLM_MAX_TOKENS,
          temperature: request.temperature ?? LLM_TEMPERATURE,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(
          `Groq API error: ${response.status} - ${errorText}`,
          'LLM_ERROR',
          { status: response.status, error: errorText }
        );
      }

      const data: GroqResponse_t = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new AppError('No response from Groq API', 'LLM_ERROR');
      }

      const content = data.choices[0].message.content.trim();

      return {
        content,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to generate SQL',
        'LLM_ERROR',
        { originalError: error }
      );
    }
  }
}

/**
 * Extract clean SQL from LLM response
 * Handles cases where LLM returns SQL with markdown formatting
 */
export function extractSql(response: string): string {
  let sql = response.trim();
  
  // Remove markdown code blocks if present
  if (sql.startsWith('```sql')) {
    sql = sql.slice(6);
  } else if (sql.startsWith('```')) {
    sql = sql.slice(3);
  }
  
  if (sql.endsWith('```')) {
    sql = sql.slice(0, -3);
  }
  
  return sql.trim();
}


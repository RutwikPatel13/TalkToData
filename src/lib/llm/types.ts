/**
 * LLM-related types for Phase 2 extensibility
 */

/**
 * LLM provider types - Phase 2 ready
 */
export type LlmProvider_t = 'groq' | 'openai' | 'anthropic';

/**
 * LLM configuration
 */
export interface LlmConfig_t {
  provider: LlmProvider_t;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * LLM completion request
 */
export interface LlmCompletionRequest_t {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * LLM completion response
 */
export interface LlmCompletionResponse_t {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * LLM adapter interface for Phase 2 extensibility
 */
export interface LlmAdapter_t {
  readonly provider: LlmProvider_t;
  complete(request: LlmCompletionRequest_t): Promise<LlmCompletionResponse_t>;
}


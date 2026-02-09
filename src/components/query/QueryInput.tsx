'use client';

import * as React from 'react';
import { Button, Textarea } from '@/components/ui';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isConnected: boolean;
}

export function QueryInput({
  value,
  onChange,
  onGenerate,
  isGenerating,
  isConnected,
}: QueryInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to generate
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isConnected && value.trim() && !isGenerating) {
        onGenerate();
      }
    }
  };

  // Example questions for quick start (matched to demo database schema)
  const exampleQuestions = [
    'Show top 5 customers by total orders',
    'List all employees in Engineering department',
    'What products are running low on stock?',
    'Show total revenue by order status',
    'Which employees earn above $80,000?',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Ask a Question
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Describe what data you want to retrieve in plain English
          </p>
        </div>
        <div className="text-xs text-neutral-400 dark:text-neutral-500">
          <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
            ⌘
          </kbd>
          {' + '}
          <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
            Enter
          </kbd>
          {' to generate'}
        </div>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isConnected
              ? 'e.g., Show me all orders from the last 30 days...'
              : 'Connect to a database first to start asking questions...'
          }
          disabled={!isConnected}
          className={cn(
            'min-h-[120px] resize-none text-base',
            !isConnected && 'cursor-not-allowed opacity-60'
          )}
        />
      </div>

      {/* Example questions */}
      {isConnected && !value && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Try:
          </span>
          {exampleQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => onChange(question)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onGenerate}
          disabled={!isConnected || !value.trim() || isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating SQL...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate SQL
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


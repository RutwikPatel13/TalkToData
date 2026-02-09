'use client';

import * as React from 'react';
import {
  History,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui';
import type { QueryHistoryEntry_t } from '@/hooks';

interface QueryHistoryProps {
  history: QueryHistoryEntry_t[];
  onLoadQuery: (question: string, sql: string) => void;
  onRemoveEntry: (id: string) => void;
  onClearHistory: () => void;
}

export function QueryHistory({
  history,
  onLoadQuery,
  onRemoveEntry,
  onClearHistory,
}: QueryHistoryProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <History className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No query history yet
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Run some queries to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            History
          </h2>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {history.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="h-7 text-xs text-neutral-500 hover:text-red-500"
        >
          Clear all
        </Button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-2">
        {history.map((entry) => (
          <HistoryItem
            key={entry.id}
            entry={entry}
            isExpanded={expandedId === entry.id}
            onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            onLoad={() => onLoadQuery(entry.question, entry.sql)}
            onRemove={() => onRemoveEntry(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface HistoryItemProps {
  entry: QueryHistoryEntry_t;
  isExpanded: boolean;
  onToggle: () => void;
  onLoad: () => void;
  onRemove: () => void;
}

/**
 * Format timestamp as relative time (e.g., "2 min ago", "1 hour ago")
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
}

function HistoryItem({ entry, isExpanded, onToggle, onLoad, onRemove }: HistoryItemProps) {
  const timeAgo = formatTimeAgo(entry.timestamp);

  return (
    <div className="mb-2 rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <div
        className="flex cursor-pointer items-start gap-2 p-3"
        onClick={onToggle}
      >
        {/* Status Icon */}
        {entry.status === 'success' ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
        ) : (
          <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {entry.question || 'Manual SQL query'}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
            {entry.rowCount !== null && entry.status === 'success' && (
              <>
                <span>•</span>
                <span>{entry.rowCount} rows</span>
              </>
            )}
            {entry.executionTimeMs !== null && (
              <>
                <span>•</span>
                <span>{entry.executionTimeMs}ms</span>
              </>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
          {/* SQL Preview */}
          <pre className="mb-3 max-h-32 overflow-auto rounded bg-neutral-100 p-2 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {entry.sql}
          </pre>

          {/* Error message if failed */}
          {entry.status === 'error' && entry.error && (
            <p className="mb-3 text-xs text-red-500">{entry.error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" onClick={onLoad} className="flex-1 gap-1">
              <Play className="h-3 w-3" />
              Load Query
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-neutral-500 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


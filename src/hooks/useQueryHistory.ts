'use client';

import * as React from 'react';

/**
 * Query history entry type
 */
export interface QueryHistoryEntry_t {
  id: string;
  question: string;
  sql: string;
  timestamp: number;
  rowCount: number | null;
  executionTimeMs: number | null;
  status: 'success' | 'error';
  error?: string;
}

const HISTORY_STORAGE_KEY = 'talktodata_query_history';
const MAX_HISTORY_ENTRIES = 50;

/**
 * Generate a unique ID for history entries
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Load history from localStorage
 */
function loadHistory(): QueryHistoryEntry_t[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Save history to localStorage
 */
function saveHistory(history: QueryHistoryEntry_t[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

interface UseQueryHistoryReturn_t {
  history: QueryHistoryEntry_t[];
  addEntry: (entry: Omit<QueryHistoryEntry_t, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
}

/**
 * Hook for managing query history in localStorage
 */
export function useQueryHistory(): UseQueryHistoryReturn_t {
  const [history, setHistory] = React.useState<QueryHistoryEntry_t[]>([]);

  // Load history on mount
  React.useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addEntry = React.useCallback(
    (entry: Omit<QueryHistoryEntry_t, 'id' | 'timestamp'>) => {
      setHistory((prev) => {
        const newEntry: QueryHistoryEntry_t = {
          ...entry,
          id: generateId(),
          timestamp: Date.now(),
        };

        // Add to beginning, limit to max entries
        const updated = [newEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
        saveHistory(updated);
        return updated;
      });
    },
    []
  );

  const removeEntry = React.useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((entry) => entry.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = React.useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
  };
}


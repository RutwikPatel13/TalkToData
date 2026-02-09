'use client';

import * as React from 'react';
import type { QueryState_t, QueryResult_t } from '@/types';
import { API_ENDPOINTS } from '@/lib/utils/constants';

export interface QueryTab_t {
  id: string;
  name: string;
  isRenamed: boolean; // true if user manually renamed this tab
  question: string;
  sql: string;
  state: QueryState_t;
}

interface UseQueryTabsReturn_t {
  tabs: QueryTab_t[];
  activeTabId: string;
  activeTab: QueryTab_t | undefined;
  isFixing: boolean;
  setActiveTab: (id: string) => void;
  addTab: () => void;
  closeTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  setQuestion: (question: string) => void;
  setSql: (sql: string) => void;
  generateSql: () => Promise<void>;
  executeSql: () => Promise<void>;
  fixSql: () => Promise<void>;
}

function createTab(): QueryTab_t {
  const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    name: '', // Will be set by renumberTabs
    isRenamed: false,
    question: '',
    sql: '',
    state: { status: 'idle' },
  };
}

// Renumber tabs that haven't been manually renamed
function renumberTabs(tabs: QueryTab_t[]): QueryTab_t[] {
  let queryNumber = 1;
  return tabs.map((tab) => {
    if (tab.isRenamed) {
      return tab;
    }
    return { ...tab, name: `Query ${queryNumber++}` };
  });
}

export function useQueryTabs(): UseQueryTabsReturn_t {
  const [tabs, setTabs] = React.useState<QueryTab_t[]>(() => renumberTabs([createTab()]));
  const [activeTabId, setActiveTabId] = React.useState<string>('');
  const [isFixing, setIsFixing] = React.useState(false);

  // Set initial activeTabId to first tab on mount
  React.useEffect(() => {
    if (tabs.length > 0 && !activeTabId) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  const activeTab = React.useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const updateActiveTab = React.useCallback(
    (updates: Partial<QueryTab_t>) => {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTabId ? { ...tab, ...updates } : tab))
      );
    },
    [activeTabId]
  );

  const setActiveTab = React.useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const addTab = React.useCallback(() => {
    const newTab = createTab();
    setTabs((prev) => renumberTabs([...prev, newTab]));
    setActiveTabId(newTab.id);
  }, []);

  const closeTab = React.useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev; // Don't close last tab
        const newTabs = prev.filter((t) => t.id !== id);
        // If closing active tab, switch to another
        if (id === activeTabId) {
          const closedIndex = prev.findIndex((t) => t.id === id);
          const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
          setActiveTabId(newTabs[newActiveIndex]?.id || '');
        }
        // Renumber non-renamed tabs
        return renumberTabs(newTabs);
      });
    },
    [activeTabId]
  );

  const renameTab = React.useCallback((id: string, name: string) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, name, isRenamed: true } : tab)));
  }, []);

  const reorderTabs = React.useCallback((fromIndex: number, toIndex: number) => {
    setTabs((prev) => {
      const newTabs = [...prev];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      // Renumber non-renamed tabs after reordering
      return renumberTabs(newTabs);
    });
  }, []);

  const setQuestion = React.useCallback(
    (question: string) => updateActiveTab({ question }),
    [updateActiveTab]
  );

  const setSql = React.useCallback(
    (sql: string) => updateActiveTab({ sql }),
    [updateActiveTab]
  );

  const generateSql = React.useCallback(async () => {
    if (!activeTab?.question.trim()) return;

    updateActiveTab({ state: { status: 'generating', question: activeTab.question } });

    try {
      const response = await fetch(API_ENDPOINTS.GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: activeTab.question }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        updateActiveTab({
          state: {
            status: 'error',
            sql: '',
            error: data.error?.message || 'Failed to generate SQL',
            question: activeTab.question,
          },
        });
        return;
      }

      const generatedSql = data.data.sql;
      updateActiveTab({
        sql: generatedSql,
        state: { status: 'editing', sql: generatedSql, question: activeTab.question },
      });
    } catch (error) {
      updateActiveTab({
        state: {
          status: 'error',
          sql: '',
          error: error instanceof Error ? error.message : 'Failed to generate SQL',
          question: activeTab.question,
        },
      });
    }
  }, [activeTab, updateActiveTab]);

  const executeSql = React.useCallback(async () => {
    if (!activeTab?.sql.trim()) return;

    const currentQuestion = activeTab.question;
    updateActiveTab({ state: { status: 'executing', sql: activeTab.sql } });

    try {
      const response = await fetch(API_ENDPOINTS.EXECUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: activeTab.sql }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        updateActiveTab({
          state: {
            status: 'error',
            sql: activeTab.sql,
            error: data.error?.message || 'Failed to execute query',
            question: currentQuestion,
          },
        });
        return;
      }

      updateActiveTab({
        state: {
          status: 'success',
          sql: activeTab.sql,
          results: data.data as QueryResult_t,
          question: currentQuestion,
        },
      });
    } catch (error) {
      updateActiveTab({
        state: {
          status: 'error',
          sql: activeTab.sql,
          error: error instanceof Error ? error.message : 'Failed to execute query',
          question: currentQuestion,
        },
      });
    }
  }, [activeTab, updateActiveTab]);

  const fixSql = React.useCallback(async () => {
    if (!activeTab || activeTab.state.status !== 'error' || !activeTab.sql.trim()) return;

    const errorMessage = activeTab.state.error;
    setIsFixing(true);

    try {
      const response = await fetch(API_ENDPOINTS.FIX, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: activeTab.sql, error: errorMessage }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Failed to fix SQL:', data.error?.message);
        return;
      }

      const fixedSql = data.data.sql;
      updateActiveTab({
        sql: fixedSql,
        state: { status: 'editing', sql: fixedSql, question: activeTab.question },
      });
    } catch (error) {
      console.error('Failed to fix SQL:', error);
    } finally {
      setIsFixing(false);
    }
  }, [activeTab, updateActiveTab]);

  return {
    tabs,
    activeTabId,
    activeTab,
    isFixing,
    setActiveTab,
    addTab,
    closeTab,
    renameTab,
    reorderTabs,
    setQuestion,
    setSql,
    generateSql,
    executeSql,
    fixSql,
  };
}


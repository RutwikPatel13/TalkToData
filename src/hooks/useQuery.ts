'use client';

import * as React from 'react';
import type { QueryState_t, QueryResult_t } from '@/types';
import { API_ENDPOINTS } from '@/lib/utils/constants';

interface UseQueryReturn_t {
  state: QueryState_t;
  question: string;
  sql: string;
  isFixing: boolean;
  setQuestion: (question: string) => void;
  setSql: (sql: string) => void;
  generateSql: () => Promise<void>;
  executeSql: () => Promise<void>;
  fixSql: () => Promise<void>;
  reset: () => void;
}

export function useQuery(): UseQueryReturn_t {
  const [state, setState] = React.useState<QueryState_t>({ status: 'idle' });
  const [question, setQuestion] = React.useState('');
  const [sql, setSql] = React.useState('');
  const [isFixing, setIsFixing] = React.useState(false);

  const generateSql = React.useCallback(async () => {
    if (!question.trim()) return;

    setState({ status: 'generating', question });

    try {
      const response = await fetch(API_ENDPOINTS.GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setState({
          status: 'error',
          sql: '',
          error: data.error?.message || 'Failed to generate SQL',
          question,
        });
        return;
      }

      const generatedSql = data.data.sql;
      setSql(generatedSql);
      setState({ status: 'editing', sql: generatedSql, question });
    } catch (error) {
      setState({
        status: 'error',
        sql: '',
        error: error instanceof Error ? error.message : 'Failed to generate SQL',
        question,
      });
    }
  }, [question]);

  const executeSql = React.useCallback(async () => {
    if (!sql.trim()) return;

    const currentQuestion = state.status === 'idle' ? '' : 
      (state.status === 'generating' || state.status === 'editing' || 
       state.status === 'success' || state.status === 'error') ? 
      (state as { question: string }).question : '';

    setState({ status: 'executing', sql });

    try {
      const response = await fetch(API_ENDPOINTS.EXECUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setState({
          status: 'error',
          sql,
          error: data.error?.message || 'Failed to execute query',
          question: currentQuestion,
        });
        return;
      }

      setState({
        status: 'success',
        sql,
        results: data.data as QueryResult_t,
        question: currentQuestion,
      });
    } catch (error) {
      setState({
        status: 'error',
        sql,
        error: error instanceof Error ? error.message : 'Failed to execute query',
        question: currentQuestion,
      });
    }
  }, [sql, state]);

  const fixSql = React.useCallback(async () => {
    // Only fix if we're in an error state with SQL
    if (state.status !== 'error' || !sql.trim()) return;

    const errorMessage = state.error;
    setIsFixing(true);

    try {
      const response = await fetch(API_ENDPOINTS.FIX, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, error: errorMessage }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Keep the error state but show a toast or something
        console.error('Failed to fix SQL:', data.error?.message);
        return;
      }

      // Update the SQL with the fixed version
      const fixedSql = data.data.sql;
      setSql(fixedSql);
      setState({ status: 'editing', sql: fixedSql, question });
    } catch (error) {
      console.error('Failed to fix SQL:', error);
    } finally {
      setIsFixing(false);
    }
  }, [sql, state, question]);

  const reset = React.useCallback(() => {
    setState({ status: 'idle' });
    setQuestion('');
    setSql('');
  }, []);

  return {
    state,
    question,
    sql,
    isFixing,
    setQuestion,
    setSql,
    generateSql,
    executeSql,
    fixSql,
    reset,
  };
}


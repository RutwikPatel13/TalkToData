'use client';

import * as React from 'react';
import { PanelLeftClose, PanelLeft, Database, History } from 'lucide-react';
import { Navbar } from '@/components/layout';
import { ConnectionModal } from '@/components/connection';
import { QueryInput, SqlEditor, QueryTabs } from '@/components/query';
import { ResultsTable } from '@/components/results';
import { SchemaExplorer } from '@/components/schema';
import { QueryHistory } from '@/components/history';
import { OnboardingTour } from '@/components/onboarding';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { useConnection, useQueryTabs, useQueryHistory } from '@/hooks';
import { cn } from '@/lib/utils/cn';

type SidebarTab_t = 'schema' | 'history';

export default function Home() {
  const [connectionModalOpen, setConnectionModalOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [sidebarTab, setSidebarTab] = React.useState<SidebarTab_t>('schema');
  const [showTour, setShowTour] = React.useState(false);
  const { status, schema, refreshSchema } = useConnection();
  const {
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
  } = useQueryTabs();
  const { history, addEntry, removeEntry, clearHistory } = useQueryHistory();

  const isConnected = status === 'connected';
  const state = activeTab?.state ?? { status: 'idle' as const };
  const question = activeTab?.question ?? '';
  const sql = activeTab?.sql ?? '';
  const isGenerating = state.status === 'generating';
  const isExecuting = state.status === 'executing';
  const results = state.status === 'success' ? state.results : null;
  const error = state.status === 'error' ? state.error : null;

  // Track previous state to detect query completion
  const prevStateRef = React.useRef(state.status);

  // Add to history when query completes (success or error)
  React.useEffect(() => {
    const prevStatus = prevStateRef.current;
    const currentStatus = state.status;
    prevStateRef.current = currentStatus;

    // Only add to history when transitioning from 'executing' to 'success' or 'error'
    if (prevStatus === 'executing' && (currentStatus === 'success' || currentStatus === 'error')) {
      const currentQuestion = 'question' in state ? (state as { question: string }).question : '';
      const currentSql = 'sql' in state ? (state as { sql: string }).sql : sql;

      if (currentStatus === 'success' && 'results' in state) {
        const queryResults = state.results;
        addEntry({
          question: currentQuestion,
          sql: currentSql,
          rowCount: queryResults?.rowCount ?? null,
          executionTimeMs: queryResults?.executionTimeMs ?? null,
          status: 'success',
        });
      } else if (currentStatus === 'error' && 'error' in state) {
        addEntry({
          question: currentQuestion,
          sql: currentSql,
          rowCount: null,
          executionTimeMs: null,
          status: 'error',
          error: state.error,
        });
      }
    }
  }, [state, sql, addEntry]);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();

        // If we have SQL and not executing, run the query
        if (sql.trim() && !isExecuting && isConnected) {
          executeSql();
        }
        // Otherwise if we have a question and not generating, generate SQL
        else if (question.trim() && !isGenerating && isConnected && !sql.trim()) {
          generateSql();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sql, question, isExecuting, isGenerating, isConnected, executeSql, generateSql]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onConnectClick={() => setConnectionModalOpen(true)} />

      <div className="flex flex-1">
        {/* Sidebar with Tabs */}
        {isConnected && (
          <aside
            data-tour="schema-explorer"
            className={cn(
              'relative flex flex-col border-r border-neutral-200 bg-white transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950',
              sidebarOpen ? 'w-72' : 'w-0'
            )}
          >
            {sidebarOpen && (
              <>
                {/* Tab Buttons */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => setSidebarTab('schema')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors',
                      sidebarTab === 'schema'
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                    )}
                  >
                    <Database className="h-4 w-4" />
                    Schema
                  </button>
                  <button
                    onClick={() => setSidebarTab('history')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors',
                      sidebarTab === 'history'
                        ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                    )}
                  >
                    <History className="h-4 w-4" />
                    History
                    {history.length > 0 && (
                      <span className="rounded-full bg-neutral-200 px-1.5 text-xs dark:bg-neutral-700">
                        {history.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {sidebarTab === 'schema' ? (
                    <SchemaExplorer
                      schema={schema}
                      onRefresh={refreshSchema}
                    />
                  ) : (
                    <QueryHistory
                      history={history}
                      onLoadQuery={(q, s) => {
                        setQuestion(q);
                        setSql(s);
                      }}
                      onRemoveEntry={removeEntry}
                      onClearHistory={clearHistory}
                    />
                  )}
                </div>

                {/* Toggle button on right edge of sidebar */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute -right-8 top-0 z-10 flex h-10 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  title="Hide sidebar"
                >
                  <PanelLeftClose className="h-4 w-4 text-neutral-500" />
                </button>
              </>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className="relative flex-1 overflow-auto">
          {/* Sidebar Toggle Button (only when sidebar is closed) */}
          {isConnected && !sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="absolute left-2 top-2 z-10 h-8 w-8 p-0"
              title="Show sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="mx-auto max-w-4xl px-6 py-8">
            {/* Welcome message when not connected */}
            {!isConnected && (
              <div className="mb-8 rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Welcome to TalkToData
                </h2>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                  Connect to your PostgreSQL database to start querying with natural language.
                </p>
                <button
                  onClick={() => setConnectionModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Connect Database
                </button>
              </div>
            )}

            {/* Query Tabs */}
            {isConnected && (
              <div className="mb-4 rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <QueryTabs
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onSelectTab={setActiveTab}
                  onAddTab={addTab}
                  onCloseTab={closeTab}
                  onRenameTab={renameTab}
                  onReorderTabs={reorderTabs}
                />
              </div>
            )}

            {/* Query Interface */}
            <div className="space-y-6">
              {/* Natural Language Input */}
              <section
                data-tour="query-input"
                className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
              >
                <QueryInput
                  value={question}
                  onChange={setQuestion}
                  onGenerate={generateSql}
                  isGenerating={isGenerating}
                  isConnected={isConnected}
                />
              </section>

              {/* SQL Editor */}
              {(sql || state.status !== 'idle') && (
                <section
                  data-tour="sql-editor"
                  className="animate-fade-in rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <SqlEditor
                    value={sql}
                    onChange={setSql}
                    onExecute={executeSql}
                    isExecuting={isExecuting}
                    disabled={!isConnected}
                    schema={schema}
                  />
                </section>
              )}

              {/* Results Table */}
              {(results || error || isExecuting) && (
                <section className="animate-fade-in rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                  <ResultsTable
                    results={results}
                    isLoading={isExecuting}
                    error={error}
                    onFixError={error ? fixSql : undefined}
                    isFixing={isFixing}
                  />
                </section>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-4 dark:border-neutral-800">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
          <span>TalkToData • Query databases with natural language</span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <button
            onClick={() => setShowTour(true)}
            className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Take a Tour
          </button>
        </div>
      </footer>

      {/* Connection Modal */}
      <ConnectionModal
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        forceOpen={showTour}
        onForceOpenChange={setShowTour}
      />
    </div>
  );
}

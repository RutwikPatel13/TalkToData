'use client';

import * as React from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor, languages, IDisposable } from 'monaco-editor';
import { format } from 'sql-formatter';
import { Button } from '@/components/ui';
import { Play, Loader2, Copy, Check, Lightbulb, X, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { API_ENDPOINTS } from '@/lib/utils/constants';
import type { Schema_t } from '@/types';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  disabled?: boolean;
  schema?: Schema_t | null;
}

export function SqlEditor({
  value,
  onChange,
  onExecute,
  isExecuting,
  disabled = false,
  schema,
}: SqlEditorProps) {
  const [copied, setCopied] = React.useState(false);
  const [theme, setTheme] = React.useState<'vs' | 'vs-dark'>('vs');
  const [explanation, setExplanation] = React.useState<string | null>(null);
  const [isExplaining, setIsExplaining] = React.useState(false);
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = React.useRef<Monaco | null>(null);
  const completionProviderRef = React.useRef<IDisposable | null>(null);

  // Use refs to always have latest values in callbacks
  const onExecuteRef = React.useRef(onExecute);
  const isExecutingRef = React.useRef(isExecuting);
  const valueRef = React.useRef(value);
  const disabledRef = React.useRef(disabled);
  const schemaRef = React.useRef(schema);

  React.useEffect(() => {
    onExecuteRef.current = onExecute;
    isExecutingRef.current = isExecuting;
    valueRef.current = value;
    disabledRef.current = disabled;
    schemaRef.current = schema;
  }, [onExecute, isExecuting, value, disabled, schema]);

  // Clear explanation when SQL changes
  React.useEffect(() => {
    setExplanation(null);
  }, [value]);

  // Detect theme changes
  React.useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'vs-dark' : 'vs');
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Register autocomplete provider when schema changes
  React.useEffect(() => {
    if (!monacoRef.current || !schema) return;

    const monaco = monacoRef.current;

    // Dispose previous provider
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    // Build completion items from schema
    const tableCompletions: languages.CompletionItem[] = schema.tables.map((table) => ({
      label: table.name,
      kind: monaco.languages.CompletionItemKind.Class,
      insertText: table.name,
      detail: `Table${table.rowCount !== undefined ? ` (${table.rowCount} rows)` : ''}`,
      documentation: `Columns: ${table.columns.map((c) => c.name).join(', ')}`,
      range: undefined as unknown as languages.CompletionItem['range'],
    }));

    const columnCompletions: languages.CompletionItem[] = schema.tables.flatMap((table) =>
      table.columns.map((col) => ({
        label: col.name,
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: col.name,
        detail: `${col.dataType}${col.nullable ? ' (nullable)' : ''}`,
        documentation: `Column from ${table.name}`,
        range: undefined as unknown as languages.CompletionItem['range'],
      }))
    );

    // Also add table.column format
    const qualifiedColumnCompletions: languages.CompletionItem[] = schema.tables.flatMap((table) =>
      table.columns.map((col) => ({
        label: `${table.name}.${col.name}`,
        kind: monaco.languages.CompletionItemKind.Field,
        insertText: `${table.name}.${col.name}`,
        detail: col.dataType,
        documentation: `Qualified column reference`,
        range: undefined as unknown as languages.CompletionItem['range'],
      }))
    );

    // Register completion provider
    completionProviderRef.current = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (
        model: Parameters<languages.CompletionItemProvider['provideCompletionItems']>[0],
        position: Parameters<languages.CompletionItemProvider['provideCompletionItems']>[1]
      ) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          ...tableCompletions.map((item) => ({ ...item, range })),
          ...columnCompletions.map((item) => ({ ...item, range })),
          ...qualifiedColumnCompletions.map((item) => ({ ...item, range })),
        ];

        return { suggestions };
      },
    });

    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
    };
  }, [schema]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    if (!value.trim()) return;
    try {
      const formatted = format(value, {
        language: 'postgresql',
        keywordCase: 'upper',
        indentStyle: 'standard',
        linesBetweenQueries: 2,
      });
      onChange(formatted);
    } catch {
      // If formatting fails, keep original
    }
  };

  const handleExplain = async () => {
    if (!value.trim() || isExplaining) return;

    setIsExplaining(true);
    try {
      const response = await fetch(API_ENDPOINTS.EXPLAIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: value }),
      });

      const data = await response.json();

      if (data.success) {
        setExplanation(data.data.explanation);
      } else {
        setExplanation(`Error: ${data.error?.message || 'Failed to explain query'}`);
      }
    } catch {
      setExplanation('Error: Failed to explain query');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleEditorChange = (val: string | undefined) => {
    onChange(val ?? '');
  };

  // Handle keyboard shortcuts in editor
  const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;

    // Add Cmd/Ctrl + Enter keybinding
    editorInstance.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [
        // Monaco KeyMod.CtrlCmd = 2048, KeyCode.Enter = 3
        2048 | 3,
      ],
      run: () => {
        if (!isExecutingRef.current && valueRef.current.trim() && !disabledRef.current) {
          onExecuteRef.current();
        }
      },
    });

    // Add Cmd/Ctrl + Shift + F for format
    editorInstance.addAction({
      id: 'format-sql',
      label: 'Format SQL',
      keybindings: [
        // Monaco KeyMod.CtrlCmd = 2048, KeyMod.Shift = 1024, KeyCode.KeyF = 36
        2048 | 1024 | 36,
      ],
      run: () => {
        const currentValue = valueRef.current;
        if (currentValue.trim()) {
          try {
            const formatted = format(currentValue, {
              language: 'postgresql',
              keywordCase: 'upper',
              indentStyle: 'standard',
              linesBetweenQueries: 2,
            });
            editorInstance.setValue(formatted);
          } catch {
            // If formatting fails, keep original
          }
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            SQL Query
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Review and edit the generated SQL before executing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            disabled={!value || disabled}
            className="gap-2"
            title="Format SQL (⌘+Shift+F)"
          >
            <Wand2 className="h-4 w-4" />
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!value}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <div className="text-xs text-neutral-400 dark:text-neutral-500">
            <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
              ⌘
            </kbd>
            {' + '}
            <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
              Enter
            </kbd>
            {' to run'}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800',
          disabled && 'opacity-60'
        )}
      >
        <Editor
          height="200px"
          language="sql"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme={theme}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            readOnly: disabled,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {/* Explanation Panel */}
      {explanation && (
        <div className="relative rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <button
            onClick={() => setExplanation(null)}
            className="absolute right-2 top-2 rounded p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
            <div className="pr-6">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Query Explanation
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-blue-800 dark:text-blue-200">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExplain}
          disabled={disabled || !value.trim() || isExplaining}
          className="gap-2"
        >
          {isExplaining ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Explaining...
            </>
          ) : (
            <>
              <Lightbulb className="h-4 w-4" />
              Explain
            </>
          )}
        </Button>
        <Button
          data-tour="execute-button"
          onClick={onExecute}
          disabled={disabled || !value.trim() || isExecuting}
          variant="accent"
          className="gap-2"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Query
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


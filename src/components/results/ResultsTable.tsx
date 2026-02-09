'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown, SearchX, Wand2, Loader2, Table2, BarChart3, Copy, Check, FileJson, Sparkles } from 'lucide-react';
import { ChartView, type ChartType_t } from './ChartView';
import type { QueryResult_t } from '@/types';
import { cn } from '@/lib/utils/cn';

type ViewMode_t = 'table' | 'chart';

interface ResultsTableProps {
  results: QueryResult_t | null;
  isLoading?: boolean;
  error?: string | null;
  onFixError?: () => void;
  isFixing?: boolean;
}

export function ResultsTable({ results, isLoading, error, onFixError, isFixing }: ResultsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [viewMode, setViewMode] = React.useState<ViewMode_t>('table');
  const [chartType, setChartType] = React.useState<ChartType_t>('bar');
  const [xAxisColumn, setXAxisColumn] = React.useState<string>('');
  const [yAxisColumn, setYAxisColumn] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);
  const [isLoadingChartSuggestion, setIsLoadingChartSuggestion] = React.useState(false);
  const [chartSuggestion, setChartSuggestion] = React.useState<string | null>(null);

  // Get columns suitable for X-axis (any) and Y-axis (numeric)
  const { allColumns, numericColumns } = React.useMemo(() => {
    if (!results?.columns) return { allColumns: [], numericColumns: [] };

    const all = results.columns.map((c) => c.name);
    const numeric = results.columns
      .filter((c) => {
        const type = c.dataType.toLowerCase();
        return (
          type.includes('int') ||
          type.includes('float') ||
          type.includes('double') ||
          type.includes('decimal') ||
          type.includes('numeric') ||
          type.includes('real') ||
          type.includes('money')
        );
      })
      .map((c) => c.name);

    return { allColumns: all, numericColumns: numeric };
  }, [results?.columns]);

  // Auto-select columns when results change
  React.useEffect(() => {
    if (allColumns.length > 0 && !xAxisColumn) {
      setXAxisColumn(allColumns[0]);
    }
    if (numericColumns.length > 0 && !yAxisColumn) {
      setYAxisColumn(numericColumns[0]);
    } else if (allColumns.length > 1 && !yAxisColumn) {
      setYAxisColumn(allColumns[1]);
    }
  }, [allColumns, numericColumns, xAxisColumn, yAxisColumn]);

  // Generate columns from results
  const columns = React.useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!results?.columns) return [];
    
    return results.columns.map((col) => ({
      accessorKey: col.name,
      header: ({ column }) => {
        const sortDirection = column.getIsSorted();
        return (
          <button
            className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-50"
            onClick={() => column.toggleSorting(sortDirection === 'asc')}
          >
            {col.name}
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-blue-500" />
            ) : sortDirection === 'desc' ? (
              <ArrowDown className="h-3 w-3 text-blue-500" />
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-50" />
            )}
          </button>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null) {
          return <span className="text-neutral-400 italic">NULL</span>;
        }
        if (typeof value === 'object') {
          return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
        }
        return String(value);
      },
    }));
  }, [results?.columns]);

  const table = useReactTable({
    data: results?.rows ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

  const handleExportCsv = () => {
    if (!results) return;

    const headers = results.columns.map((c) => c.name).join(',');
    const rows = results.rows.map((row) =>
      results.columns.map((col) => {
        const val = row[col.name];
        if (val === null) return '';
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return String(val);
      }).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!results) return;

    const json = JSON.stringify(results.rows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (!results) return;

    // Format as tab-separated values for easy pasting into spreadsheets
    const headers = results.columns.map((c) => c.name).join('\t');
    const rows = results.rows.map((row) =>
      results.columns.map((col) => {
        const val = row[col.name];
        if (val === null) return '';
        return String(val);
      }).join('\t')
    ).join('\n');

    const tsv = `${headers}\n${rows}`;

    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleAutoChartSuggestion = async () => {
    if (!results || results.rowCount === 0) return;

    setIsLoadingChartSuggestion(true);
    setChartSuggestion(null);

    try {
      const response = await fetch('/api/chart-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns: results.columns,
          sampleRows: results.rows.slice(0, 5),
          rowCount: results.rowCount,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { chartType: suggestedType, xAxis, yAxis, explanation } = data.data;

        // Apply the suggestion
        if (suggestedType && ['bar', 'line', 'pie'].includes(suggestedType)) {
          setChartType(suggestedType as ChartType_t);
        }
        if (xAxis && allColumns.includes(xAxis)) {
          setXAxisColumn(xAxis);
        }
        if (yAxis && (numericColumns.includes(yAxis) || allColumns.includes(yAxis))) {
          setYAxisColumn(yAxis);
        }

        setChartSuggestion(explanation || 'Chart configured based on your data.');
        setViewMode('chart');
      }
    } catch (err) {
      console.error('Failed to get chart suggestion:', err);
      setChartSuggestion('Failed to analyze data. Please select chart options manually.');
    } finally {
      setIsLoadingChartSuggestion(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-1 text-sm font-medium text-red-800 dark:text-red-200">
                Query Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            {onFixError && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFixError}
                disabled={isFixing}
                className="flex-shrink-0 gap-2 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
              >
                {isFixing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Fix with AI
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-neutral-500 dark:text-neutral-400">
        <p>No results yet. Run a query to see data here.</p>
      </div>
    );
  }

  // Empty results state
  if (results.rowCount === 0) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Results
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Query completed in {results.executionTimeMs}ms
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 py-16 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
            <SearchX className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-neutral-700 dark:text-neutral-300">
            No matching records
          </h3>
          <p className="max-w-sm text-center text-sm text-neutral-500 dark:text-neutral-400">
            Your query executed successfully but returned no results. Try adjusting your search criteria or filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Results
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {results.rowCount} {results.rowCount === 1 ? 'row' : 'rows'} in {results.executionTimeMs}ms
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-md border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'table'
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              )}
            >
              <Table2 className="h-4 w-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'chart'
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Chart
            </button>
          </div>

          {/* AI Chart Suggestion */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoChartSuggestion}
            disabled={isLoadingChartSuggestion}
            className="gap-2"
            title="Let AI suggest the best chart for your data"
          >
            {isLoadingChartSuggestion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Auto Chart
          </Button>

          {/* Copy to Clipboard */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyToClipboard}
            className="gap-2"
            title="Copy results to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>

          {/* Export Buttons */}
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2" title="Download as CSV">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-2" title="Download as JSON">
            <FileJson className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* AI Chart Suggestion */}
      {chartSuggestion && viewMode === 'chart' && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div className="flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">{chartSuggestion}</p>
          </div>
          <button
            onClick={() => setChartSuggestion(null)}
            className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Chart Controls */}
      {viewMode === 'chart' && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Type:</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType_t)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">X-Axis:</label>
            <select
              value={xAxisColumn}
              onChange={(e) => setXAxisColumn(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              {allColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Y-Axis:</label>
            <select
              value={yAxisColumn}
              onChange={(e) => setYAxisColumn(e.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              {(numericColumns.length > 0 ? numericColumns : allColumns).map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          {numericColumns.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              No numeric columns detected. Chart values may not display correctly.
            </p>
          )}
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <ChartView
            results={results}
            chartType={chartType}
            xAxisColumn={xAxisColumn}
            yAxisColumn={yAxisColumn}
          />
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="bg-white hover:bg-neutral-50 dark:bg-neutral-950 dark:hover:bg-neutral-900">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Pagination */}
      {viewMode === 'table' && results.rowCount > 25 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


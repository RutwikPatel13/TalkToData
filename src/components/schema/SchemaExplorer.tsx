'use client';

import * as React from 'react';
import { ChevronRight, Table2, Key, Hash, Copy, Check, Database, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui';
import type { Schema_t, Table_t, Column_t } from '@/types';

interface SchemaExplorerProps {
  schema: Schema_t | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SchemaExplorer({ schema, isLoading, onRefresh }: SchemaExplorerProps) {
  const [expandedTables, setExpandedTables] = React.useState<Set<string>>(new Set());
  const [copiedItem, setCopiedItem] = React.useState<string | null>(null);

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(null), 1500);
  };

  if (!schema) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Database className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Connect to a database to explore schema
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Schema
          </h2>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {schema.tables.length} tables
          </span>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </Button>
        )}
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-y-auto p-2">
        {schema.tables.map((table) => (
          <TableItem
            key={table.name}
            table={table}
            isExpanded={expandedTables.has(table.name)}
            onToggle={() => toggleTable(table.name)}
            onCopy={copyToClipboard}
            copiedItem={copiedItem}
          />
        ))}
      </div>
    </div>
  );
}

interface TableItemProps {
  table: Table_t;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (text: string, itemId: string) => void;
  copiedItem: string | null;
}

function TableItem({ table, isExpanded, onToggle, onCopy, copiedItem }: TableItemProps) {
  const tableId = `table-${table.name}`;

  return (
    <div className="mb-1">
      {/* Table Header */}
      <div
        className="group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        onClick={onToggle}
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 text-neutral-400 transition-transform',
            isExpanded && 'rotate-90'
          )}
        />
        <Table2 className="h-3.5 w-3.5 text-blue-500" />
        <span className="flex-1 truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {table.name}
        </span>
        {table.rowCount !== undefined && table.rowCount >= 0 && (
          <span className="text-xs text-neutral-400">
            {table.rowCount.toLocaleString()} rows
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(table.name, tableId);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copiedItem === tableId ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-neutral-400 hover:text-neutral-600" />
          )}
        </button>
      </div>

      {/* Columns */}
      {isExpanded && (
        <div className="ml-4 border-l border-neutral-200 pl-2 dark:border-neutral-700">
          {table.columns.map((column) => (
            <ColumnItem
              key={column.name}
              column={column}
              tableName={table.name}
              onCopy={onCopy}
              copiedItem={copiedItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ColumnItemProps {
  column: Column_t;
  tableName: string;
  onCopy: (text: string, itemId: string) => void;
  copiedItem: string | null;
}

function ColumnItem({ column, tableName, onCopy, copiedItem }: ColumnItemProps) {
  const columnId = `column-${tableName}-${column.name}`;

  return (
    <div className="group flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
      {/* Column Icon */}
      {column.isPrimaryKey ? (
        <Key className="h-3 w-3 text-amber-500" />
      ) : (
        <Hash className="h-3 w-3 text-neutral-400" />
      )}

      {/* Column Name */}
      <span className="flex-1 truncate text-sm text-neutral-600 dark:text-neutral-400">
        {column.name}
      </span>

      {/* Data Type */}
      <span className="text-xs text-neutral-400 dark:text-neutral-500">
        {column.dataType}
        {!column.nullable && <span className="ml-1 text-red-400">*</span>}
      </span>

      {/* Copy Button */}
      <button
        onClick={() => onCopy(column.name, columnId)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copiedItem === columnId ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3 text-neutral-400 hover:text-neutral-600" />
        )}
      </button>
    </div>
  );
}


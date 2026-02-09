'use client';

import * as React from 'react';
import { Info, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { QueryTab_t } from '@/hooks';

interface QueryTabsProps {
  tabs: QueryTab_t[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, name: string) => void;
  onReorderTabs: (fromIndex: number, toIndex: number) => void;
}

export function QueryTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onRenameTab,
  onReorderTabs,
}: QueryTabsProps) {
  const [editingTabId, setEditingTabId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = React.useState<{ index: number; position: 'before' | 'after' } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  React.useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  const handleDoubleClick = (tab: QueryTab_t) => {
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  };

  const handleSaveRename = () => {
    if (editingTabId && editingName.trim()) {
      onRenameTab(editingTabId, editingName.trim());
    }
    setEditingTabId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingTabId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;

    // Determine if dropping before or after based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const position = e.clientX < midpoint ? 'before' : 'after';

    setDropIndicator({ index, position });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the tabs container entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDropIndicator(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDropIndicator(null);
      return;
    }

    // Calculate the actual target index based on drop position
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    let toIndex = e.clientX < midpoint ? index : index + 1;

    // Adjust if dragging from before the drop position
    if (draggedIndex < toIndex) {
      toIndex -= 1;
    }

    if (draggedIndex !== toIndex) {
      onReorderTabs(draggedIndex, toIndex);
    }

    setDraggedIndex(null);
    setDropIndicator(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropIndicator(null);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto py-2">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isEditing = tab.id === editingTabId;
          const isDragging = draggedIndex === index;
          const showDropBefore = dropIndicator?.index === index && dropIndicator?.position === 'before';
          const showDropAfter = dropIndicator?.index === index && dropIndicator?.position === 'after';
          const hasContent = tab.sql || tab.question;
          const hasError = tab.state.status === 'error';
          const hasSuccess = tab.state.status === 'success';

          return (
            <React.Fragment key={tab.id}>
              {/* Drop indicator line - before */}
              {showDropBefore && (
                <div className="mx-0.5 h-6 w-0.5 shrink-0 rounded-full bg-blue-500" />
              )}

              <div
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'group relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                  'cursor-grab select-none',
                  isDragging && 'opacity-50',
                  isActive
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-50'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300',
                  hasError && !isActive && 'text-red-500 dark:text-red-400',
                  hasSuccess && !isActive && 'text-green-600 dark:text-green-400'
                )}
                onClick={() => !isEditing && onSelectTab(tab.id)}
              >
                {/* Status indicator */}
              {hasContent && (
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    hasError
                      ? 'bg-red-500'
                      : hasSuccess
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                  )}
                />
              )}

              {/* Tab name - editable on double-click */}
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className="w-[100px] rounded border border-blue-500 bg-white px-1 text-sm text-neutral-900 outline-none dark:bg-neutral-800 dark:text-neutral-100"
                />
              ) : (
                <span
                  className="max-w-[120px] truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleDoubleClick(tab);
                  }}
                  title="Double-click to rename"
                >
                  {tab.name}
                </span>
              )}

              {/* Close button */}
              {tabs.length > 1 && !isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className={cn(
                    'ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-neutral-200 dark:hover:bg-neutral-700',
                    'group-hover:opacity-100',
                    isActive && 'opacity-100'
                  )}
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              </div>

              {/* Drop indicator line - after */}
              {showDropAfter && (
                <div className="mx-0.5 h-6 w-0.5 shrink-0 rounded-full bg-blue-500" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Add tab button */}
      <button
        onClick={onAddTab}
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        title="New query tab"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Info tooltip */}
      <div className="group relative ml-1">
        <Info className="h-4 w-4 cursor-help text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300" />
        <div className="invisible absolute right-0 top-full z-[100] mt-2 w-56 rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-600 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          <p className="mb-2 font-medium text-neutral-900 dark:text-neutral-100">Tab Tips</p>
          <ul className="space-y-1.5">
            <li><strong>Double-click</strong> tab name to rename</li>
            <li><strong>Drag & drop</strong> to reorder tabs</li>
            <li>Renamed tabs keep their custom name</li>
            <li>Other tabs auto-renumber on delete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


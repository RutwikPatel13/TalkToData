'use client';

import * as React from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToastType_t = 'default' | 'success' | 'error' | 'warning';

export interface Toast_t {
  id: string;
  title?: string;
  description?: string;
  type: ToastType_t;
  duration?: number;
}

interface ToastState_t {
  toasts: Toast_t[];
}

type ToastAction_t =
  | { type: 'ADD_TOAST'; toast: Toast_t }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast_t> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId: string }
  | { type: 'REMOVE_TOAST'; toastId: string };

let count = 0;

function generateId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string, dispatch: React.Dispatch<ToastAction_t>) {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

function reducer(state: ToastState_t, action: ToastAction_t): ToastState_t {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    }

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
}

type ToastContextValue_t = {
  toasts: Toast_t[];
  toast: (props: Omit<Toast_t, 'id'>) => string;
  dismiss: (toastId: string) => void;
};

const ToastContext = React.createContext<ToastContextValue_t | undefined>(undefined);

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  const toast = React.useCallback((props: Omit<Toast_t, 'id'>) => {
    const id = generateId();
    const newToast: Toast_t = { id, ...props };
    dispatch({ type: 'ADD_TOAST', toast: newToast });
    addToRemoveQueue(id, dispatch);
    return id;
  }, []);

  const dismiss = React.useCallback((toastId: string) => {
    dispatch({ type: 'DISMISS_TOAST', toastId });
  }, []);

  const value = React.useMemo(
    () => ({ toasts: state.toasts, toast, dismiss }),
    [state.toasts, toast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastContextProvider');
  }
  return context;
}


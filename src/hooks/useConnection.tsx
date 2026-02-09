'use client';

import * as React from 'react';
import type { ConnectionConfig_t, ConnectionStatus_t, Schema_t } from '@/types';
import { API_ENDPOINTS } from '@/lib/utils/constants';

interface ConnectionState_t {
  status: ConnectionStatus_t;
  config: ConnectionConfig_t | null;
  schema: Schema_t | null;
  error: string | null;
  isRestoring: boolean;
}

interface ConnectionContextValue_t extends ConnectionState_t {
  connect: (config: ConnectionConfig_t) => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshSchema: () => Promise<void>;
}

const ConnectionContext = React.createContext<ConnectionContextValue_t | undefined>(
  undefined
);

const initialState: ConnectionState_t = {
  status: 'disconnected',
  config: null,
  schema: null,
  error: null,
  isRestoring: true, // Start as true to check session on mount
};

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConnectionState_t>(initialState);

  // Check for existing session on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();

        if (data.success && data.data.connected) {
          setState({
            status: 'connected',
            config: {
              type: data.data.databaseType,
              database: data.data.databaseName,
              host: '',
              port: 0,
              username: '',
              password: '',
            },
            schema: data.data.schema || null,
            error: null,
            isRestoring: false,
          });
        } else {
          setState((prev) => ({ ...prev, isRestoring: false }));
        }
      } catch {
        setState((prev) => ({ ...prev, isRestoring: false }));
      }
    };

    checkSession();
  }, []);

  const connect = React.useCallback(
    async (config: ConnectionConfig_t): Promise<boolean> => {
      setState((prev) => ({ ...prev, status: 'connecting', error: null }));

      try {
        const response = await fetch(API_ENDPOINTS.CONNECT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: data.error?.message || 'Failed to connect',
          }));
          return false;
        }

        // Fetch schema after successful connection
        const schemaResponse = await fetch(API_ENDPOINTS.SCHEMA);
        const schemaData = await schemaResponse.json();

        setState({
          status: 'connected',
          config: config,
          schema: schemaData.success ? schemaData.data : null,
          error: null,
          isRestoring: false,
        });

        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Connection failed',
        }));
        return false;
      }
    },
    []
  );

  const disconnect = React.useCallback(async (): Promise<void> => {
    try {
      await fetch(API_ENDPOINTS.CONNECT, { method: 'DELETE' });
    } catch {
      // Ignore errors on disconnect
    }
    setState({
      status: 'disconnected',
      config: null,
      schema: null,
      error: null,
      isRestoring: false,
    });
  }, []);

  const refreshSchema = React.useCallback(async (): Promise<void> => {
    if (state.status !== 'connected') return;

    try {
      const response = await fetch(API_ENDPOINTS.SCHEMA);
      const data = await response.json();

      if (data.success) {
        setState((prev) => ({ ...prev, schema: data.data }));
      }
    } catch {
      // Ignore schema refresh errors
    }
  }, [state.status]);

  const value = React.useMemo(
    () => ({
      ...state,
      connect,
      disconnect,
      refreshSchema,
    }),
    [state, connect, disconnect, refreshSchema]
  );

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = React.useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
}


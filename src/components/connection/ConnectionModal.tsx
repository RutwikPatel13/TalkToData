'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from '@/components/ui';
import { useConnection, useToast } from '@/hooks';
import { Loader2, Database, FlaskConical } from 'lucide-react';
import { DATABASE_CONFIG, SUPPORTED_DATABASE_TYPES, type DatabaseType_t } from '@/lib/utils/constants';

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionModal({ open, onOpenChange }: ConnectionModalProps) {
  const { connect, connectDemo, status } = useConnection();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = React.useState<DatabaseType_t>('postgresql');
  const [formData, setFormData] = React.useState({
    host: 'localhost',
    port: '5432',
    database: '',
    username: '',
    password: '',
    ssl: false,
  });

  // Update port when database type changes
  React.useEffect(() => {
    const defaultPort = DATABASE_CONFIG[selectedType].defaultPort;
    setFormData(prev => ({
      ...prev,
      port: defaultPort > 0 ? String(defaultPort) : '',
      host: selectedType === 'sqlite' ? '' : prev.host || 'localhost',
    }));
  }, [selectedType]);

  const [isConnectingDemo, setIsConnectingDemo] = React.useState(false);

  const handleUseDemoDatabase = async () => {
    setIsConnectingDemo(true);

    const success = await connectDemo();

    if (success) {
      toast({
        title: 'Connected to Demo Database!',
        description: 'You can now query the sample data with natural language.',
        type: 'success',
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to demo database. Please try again.',
        type: 'error',
      });
    }

    setIsConnectingDemo(false);
  };

  const isConnecting = status === 'connecting';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const success = await connect({
      type: selectedType,
      host: formData.host,
      port: parseInt(formData.port, 10) || 0,
      database: formData.database,
      username: formData.username,
      password: formData.password,
      ssl: formData.ssl,
    });

    if (success) {
      toast({
        title: 'Connected!',
        description: `Successfully connected to ${formData.database}`,
        type: 'success',
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Connection Failed',
        description: 'Please check your credentials and try again.',
        type: 'error',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isSQLite = selectedType === 'sqlite';
  const needsHostPort = !isSQLite;
  const needsCredentials = !isSQLite;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Connect to {DATABASE_CONFIG[selectedType].name}
          </DialogTitle>
          <DialogDescription>
            Enter your database credentials. They are stored securely in an encrypted session cookie.
          </DialogDescription>
        </DialogHeader>

        {/* Database Type Selector */}
        <div className="grid grid-cols-5 gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          {SUPPORTED_DATABASE_TYPES.map((dbType) => (
            <button
              key={dbType}
              type="button"
              onClick={() => setSelectedType(dbType)}
              className={`flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs transition-colors ${
                selectedType === dbType
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
              }`}
            >
              <span className="text-lg">{DATABASE_CONFIG[dbType].icon}</span>
              <span className="truncate">{DATABASE_CONFIG[dbType].name.replace(' Server', '')}</span>
            </button>
          ))}
        </div>

        {/* Demo Database Option - only for PostgreSQL */}
        {selectedType === 'postgresql' && (
          <>
            <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                  <FlaskConical className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      🚀 Try Demo Database
                    </p>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleUseDemoDatabase}
                      disabled={isConnecting || isConnectingDemo}
                      className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
                    >
                      {isConnectingDemo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isConnectingDemo ? 'Connecting...' : 'Try Now'}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    Pre-loaded E-Commerce database with sample data:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['employees', 'products', 'customers', 'orders', 'order_items'].map((table) => (
                      <span
                        key={table}
                        className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      >
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                  Or enter your own
                </span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Host and Port - for non-SQLite databases */}
          {needsHostPort && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="host" className="text-sm font-medium">
                  Host
                </label>
                <Input
                  id="host"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  placeholder="localhost"
                  disabled={isConnecting}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="port" className="text-sm font-medium">
                  Port
                </label>
                <Input
                  id="port"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  placeholder={String(DATABASE_CONFIG[selectedType].defaultPort)}
                  disabled={isConnecting}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="database" className="text-sm font-medium">
              {isSQLite ? 'Database File Path' : 'Database'}
            </label>
            <Input
              id="database"
              name="database"
              value={formData.database}
              onChange={handleChange}
              placeholder={isSQLite ? '/path/to/database.db' : 'mydb'}
              required
              disabled={isConnecting}
            />
            {isSQLite && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Enter the full path to your SQLite database file, or use :memory: for in-memory database
              </p>
            )}
          </div>

          {/* Credentials - for non-SQLite databases */}
          {needsCredentials && (
            <>
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={selectedType === 'postgresql' ? 'postgres' : 'root'}
                  required={needsCredentials}
                  disabled={isConnecting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={needsCredentials}
                  disabled={isConnecting}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ssl"
                  name="ssl"
                  checked={formData.ssl}
                  onChange={handleChange}
                  disabled={isConnecting}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <label htmlFor="ssl" className="text-sm">
                  Use SSL {selectedType === 'mongodb' && '(uses mongodb+srv://)'}
                </label>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isConnecting}>
              {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


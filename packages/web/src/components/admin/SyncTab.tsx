import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { toast } from 'sonner';
import { formatDateShort } from '@/utils/data_conversion';
import {
  getSyncStatus,
  startSync,
  stopSync,
  triggerSync,
  getSyncLog,
  getSyncRunDetail,
  syncUsers,
} from '@/services';
import type { SyncStatus, SyncRun, SyncRunWithDetails } from '@/services';
import type { SyncRunDetail } from '@lrda/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ClickableNote from '@/components/click_note_card';
import {
  Play,
  Square,
  Zap,
  RefreshCw,
  Loader2,
  CircleCheckBig,
  CircleX,
  Clock,
  ChevronLeft,
  Users,
  Eye,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

// ============================================
// Shared helpers
// ============================================

function formatDuration(ms: number | null) {
  if (ms == null) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'success':
      return (
        <Badge variant='default' className='bg-green-600 text-xs'>
          <CircleCheckBig className='mr-1 h-3 w-3' />
          Success
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant='destructive' className='text-xs'>
          <CircleX className='mr-1 h-3 w-3' />
          Failed
        </Badge>
      );
    case 'running':
      return (
        <Badge variant='secondary' className='text-xs'>
          <Loader2 className='mr-1 h-3 w-3 animate-spin' />
          Running
        </Badge>
      );
    default:
      return (
        <Badge variant='outline' className='text-xs'>
          {status}
        </Badge>
      );
  }
}

function SortHeader({ column, children }: { column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void }; children: React.ReactNode }) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant='ghost'
      size='sm'
      className='-ml-3 h-8'
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUp className='ml-1 h-3 w-3' />
      ) : sorted === 'desc' ? (
        <ArrowDown className='ml-1 h-3 w-3' />
      ) : (
        <ArrowUpDown className='ml-1 h-3 w-3 opacity-50' />
      )}
    </Button>
  );
}

// ============================================
// Log table (sync runs)
// ============================================

function SyncLogTable({
  runs,
  loading,
  onViewDetail,
}: {
  runs: SyncRun[];
  loading: boolean;
  onViewDetail: (runId: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<SyncRun>[]>(
    () => [
      {
        accessorKey: 'startedAt',
        header: ({ column }) => <SortHeader column={column}>Time</SortHeader>,
        cell: ({ getValue }) => (
          <span className='text-xs'>{formatDateShort(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <SortHeader column={column}>Status</SortHeader>,
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
      {
        accessorKey: 'triggeredBy',
        header: ({ column }) => <SortHeader column={column}>Trigger</SortHeader>,
        cell: ({ getValue }) => (
          <span className='text-xs text-gray-500'>{getValue<string | null>() ?? '--'}</span>
        ),
      },
      {
        accessorKey: 'notesCreated',
        header: ({ column }) => (
          <div className='text-right'>
            <SortHeader column={column}>Created</SortHeader>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className='text-right font-mono text-xs'>{getValue<number>()}</div>
        ),
      },
      {
        accessorKey: 'notesUpdated',
        header: ({ column }) => (
          <div className='text-right'>
            <SortHeader column={column}>Updated</SortHeader>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className='text-right font-mono text-xs'>{getValue<number>()}</div>
        ),
      },
      {
        accessorKey: 'notesSkipped',
        header: ({ column }) => (
          <div className='text-right'>
            <SortHeader column={column}>Skipped</SortHeader>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className='text-right font-mono text-xs'>{getValue<number>()}</div>
        ),
      },
      {
        accessorKey: 'notesErrored',
        header: ({ column }) => (
          <div className='text-right'>
            <SortHeader column={column}>Errors</SortHeader>
          </div>
        ),
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return (
            <div className='text-right font-mono text-xs'>
              {v > 0 ? <span className='text-red-600'>{v}</span> : v}
            </div>
          );
        },
      },
      {
        accessorKey: 'durationMs',
        header: ({ column }) => (
          <div className='text-right'>
            <SortHeader column={column}>Duration</SortHeader>
          </div>
        ),
        cell: ({ getValue }) => (
          <div className='text-right text-xs text-gray-500'>
            {formatDuration(getValue<number | null>())}
          </div>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button
            variant='ghost'
            size='sm'
            className='h-7 text-xs'
            onClick={() => onViewDetail(row.original.id)}
          >
            Details
          </Button>
        ),
      },
    ],
    [onViewDetail],
  );

  const table = useReactTable({
    data: runs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className='space-y-3'>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className='h-12 w-full' />
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-gray-500'>
        No sync runs yet. Start a sync to see results here.
      </p>
    );
  }

  return (
    <div className='rounded-md border'>
      <table className='w-full caption-bottom text-sm'>
        <thead className='[&_tr]:border-b'>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className='border-b'>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className='h-10 px-2 text-left align-middle font-medium text-gray-500'
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className='[&_tr:last-child]:border-0'>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className='border-b transition-colors hover:bg-gray-50'>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className='p-2 align-middle'>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// Detail table (per-note, virtualized)
// ============================================

function SyncDetailTable({ details, triggeredBy }: { details: SyncRunDetail[]; triggeredBy?: string | null }) {
  const isUserSync = triggeredBy === 'users';
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<SyncRunDetail>[]>(
    () => [
      {
        accessorKey: 'noteId',
        header: ({ column }) => <SortHeader column={column}>{isUserSync ? 'User' : 'Note ID'}</SortHeader>,
        cell: ({ getValue }) => {
          const id = getValue<string>();
          if (isUserSync) {
            return <span className='text-xs text-gray-600 truncate block'>{id}</span>;
          }

          return (
            <Dialog>
              <DialogTrigger asChild>
                <button className='inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline'>
                  {id.length > 24 ? `${id.slice(0, 24)}...` : id}
                  <ExternalLink className='h-3 w-3' />
                </button>
              </DialogTrigger>
              <ClickableNote noteId={id} />
            </Dialog>
          );
        },
      },
      {
        accessorKey: 'action',
        header: ({ column }) => <SortHeader column={column}>Action</SortHeader>,
        cell: ({ getValue }) => {
          const action = getValue<string>();
          return (
            <Badge
              variant={
                action === 'created' ? 'default'
                : action === 'errored' ? 'destructive'
                : 'secondary'
              }
              className={`text-xs ${action === 'created' ? 'bg-green-600' : ''}`}
            >
              {action}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'error',
        header: ({ column }) => <SortHeader column={column}>{isUserSync ? 'Changes' : 'Error'}</SortHeader>,
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return v ? (
            <span className={`text-xs ${isUserSync ? 'text-gray-600' : 'text-red-600'}`}>{v}</span>
          ) : (
            <span className='text-xs text-gray-300'>--</span>
          );
        },
      },
    ],
    [isUserSync],
  );

  const table = useReactTable({
    data: details,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const COL_WIDTHS = ['35%', '15%', '50%'] as const;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });

  if (details.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-gray-500'>
        No item-level details for this run (all items were skipped)
      </p>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='relative'>
        <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
        <Input
          placeholder='Filter by ID, action, or details...'
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className='pl-10'
        />
      </div>
      <p className='text-xs text-gray-500'>
        {rows.length} of {details.length} items
      </p>
      <div className='rounded-md border text-sm'>
        {/* Header */}
        <div className='flex border-b bg-gray-50/80'>
          {table.getHeaderGroups().map(headerGroup =>
            headerGroup.headers.map((header, i) => (
              <div
                key={header.id}
                className='h-10 shrink-0 px-2 flex items-center font-medium text-gray-500'
                style={{ width: COL_WIDTHS[i] }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            )),
          )}
        </div>
        {/* Virtualized rows */}
        <div ref={parentRef} className='max-h-[500px] overflow-auto'>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index]!;
              return (
                <div
                  key={row.id}
                  className='absolute left-0 right-0 flex border-b transition-colors hover:bg-gray-50'
                  style={{ top: 0, transform: `translateY(${virtualRow.start}px)`, height: virtualRow.size }}
                >
                  {row.getVisibleCells().map((cell, i) => (
                    <div
                      key={cell.id}
                      className='shrink-0 px-2 flex items-center overflow-hidden'
                      style={{ width: COL_WIDTHS[i] }}
                    >
                      <div className='truncate'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main SyncTab
// ============================================

export function SyncTab() {
  const { syncRunId } = useSearch({ from: '/_app/admin' });
  const navigate = useNavigate();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [selectedRun, setSelectedRun] = useState<SyncRunWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dryRunLog, setDryRunLog] = useState<string[] | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusData, logData] = await Promise.all([getSyncStatus(), getSyncLog(50)]);
      setStatus(statusData);
      setRuns(logData.runs);
      setTotalRuns(logData.total);
    } catch (error) {
      console.error('Error fetching sync data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Load run detail when syncRunId is in the URL
  useEffect(() => {
    if (syncRunId && syncRunId !== selectedRun?.id) {
      getSyncRunDetail(syncRunId)
        .then(setSelectedRun)
        .catch((error) => { console.error('Failed to load run details:', error); toast.error('Failed to load run details'); });
    } else if (!syncRunId) {
      setSelectedRun(null);
    }
  }, [syncRunId, selectedRun?.id]);

  const handleStart = async () => {
    setActionLoading('start');
    try {
      const result = await startSync();
      toast.success(result.message);
      await fetchStatus();
    } catch (error) {
      console.error('Failed to start sync:', error);
      toast.error('Failed to start sync');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    setActionLoading('stop');
    try {
      const result = await stopSync();
      toast.success(result.message);
      await fetchStatus();
    } catch (error) {
      console.error('Failed to stop sync:', error);
      toast.error('Failed to stop sync');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTrigger = async () => {
    setActionLoading('trigger');
    try {
      const result = await triggerSync();
      toast.success(
        `Sync complete: ${result.notesCreated} created, ${result.notesUpdated} updated`,
      );
      await fetchStatus();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreview = async () => {
    setActionLoading('preview');
    try {
      const result = await triggerSync(true);
      setDryRunLog(result.logs ?? []);
    } catch (error) {
      console.error('Dry-run sync failed:', error);
      toast.error('Dry-run sync failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncUsers = async () => {
    setActionLoading('users');
    try {
      const result = await syncUsers();
      toast.success(
        `Users synced: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );
      await fetchStatus();
    } catch (error) {
      console.error('User sync failed:', error);
      toast.error('User sync failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = (runId: string) => {
    navigate({ to: '/admin', search: (prev: Record<string, unknown>) => ({ ...prev, syncRunId: runId }) });
  };

  const handleBackToLog = () => {
    navigate({ to: '/admin', search: (prev: Record<string, unknown>) => ({ ...prev, syncRunId: undefined }) });
  };

  // Detail view
  if (selectedRun) {
    return (
      <Card>
        <CardHeader>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='sm' onClick={handleBackToLog}>
              <ChevronLeft className='mr-1 h-4 w-4' />
              Back
            </Button>
            <div>
              <CardTitle className='flex items-center gap-2'>
                Run Detail
                <StatusBadge status={selectedRun.status} />
              </CardTitle>
              <CardDescription>
                {formatDateShort(selectedRun.startedAt)} -- {formatDuration(selectedRun.durationMs)}
                {' -- '}
                {selectedRun.triggeredBy ?? 'unknown'} trigger
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='mb-4 grid grid-cols-4 gap-3'>
            <div className='rounded-md border p-3 text-center'>
              <div className='text-2xl font-bold text-green-600'>{selectedRun.notesCreated}</div>
              <div className='text-xs text-gray-500'>Created</div>
            </div>
            <div className='rounded-md border p-3 text-center'>
              <div className='text-2xl font-bold text-blue-600'>{selectedRun.notesUpdated}</div>
              <div className='text-xs text-gray-500'>Updated</div>
            </div>
            <div className='rounded-md border p-3 text-center'>
              <div className='text-2xl font-bold text-gray-400'>{selectedRun.notesSkipped}</div>
              <div className='text-xs text-gray-500'>Skipped</div>
            </div>
            <div className='rounded-md border p-3 text-center'>
              <div className='text-2xl font-bold text-red-600'>{selectedRun.notesErrored}</div>
              <div className='text-xs text-gray-500'>Errored</div>
            </div>
          </div>

          {selectedRun.error && (
            <div className='mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
              {selectedRun.error}
            </div>
          )}

          <SyncDetailTable details={selectedRun.details} triggeredBy={selectedRun.triggeredBy} />
        </CardContent>
      </Card>
    );
  }

  // Main view
  return (
    <div className='space-y-4'>
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>RERUM Sync</CardTitle>
          <CardDescription>
            Sync notes from the RERUM API into PostgreSQL for the mobile app migration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-20 w-full' />
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div
                  className={`h-3 w-3 rounded-full ${status?.running ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`}
                />
                <span className='text-sm font-medium'>
                  {status?.running ? 'Sync is running' : 'Sync is stopped'}
                </span>
                {status?.running && status.nextRunAt && (
                  <span className='text-xs text-gray-500'>
                    <Clock className='mr-1 inline h-3 w-3' />
                    Next run: {formatDateShort(status.nextRunAt)}
                  </span>
                )}
                {status?.lastRunAt && (
                  <span className='text-xs text-gray-500'>
                    Last run: {formatDateShort(status.lastRunAt)}
                    {status.lastRunStatus && (
                      <span
                        className={`ml-1 ${status.lastRunStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        ({status.lastRunStatus})
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className='flex flex-wrap gap-2'>
                {status?.running ? (
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={handleStop}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === 'stop' ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Square className='mr-2 h-4 w-4' />
                    )}
                    Stop Sync
                  </Button>
                ) : (
                  <Button
                    size='sm'
                    onClick={handleStart}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === 'start' ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Play className='mr-2 h-4 w-4' />
                    )}
                    Start Sync
                  </Button>
                )}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleTrigger()}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'trigger' ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Zap className='mr-2 h-4 w-4' />
                  )}
                  Trigger Sync
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handlePreview()}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'preview' ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Eye className='mr-2 h-4 w-4' />
                  )}
                  Preview Sync
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='outline' size='sm' disabled={actionLoading !== null}>
                      {actionLoading === 'users' ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <Users className='mr-2 h-4 w-4' />
                      )}
                      Sync Users
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sync Firebase Users?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will fetch all users from Firebase Auth and sync them into PostgreSQL.
                        Existing users will be updated, new users will be created.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSyncUsers}>Sync Users</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dry-run preview log */}
      <Dialog open={dryRunLog !== null} onOpenChange={open => !open && setDryRunLog(null)}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Dry-Run Preview</DialogTitle>
            <DialogDescription>
              No changes were written. This is what a sync would do.
            </DialogDescription>
          </DialogHeader>
          <pre className='max-h-[60vh] overflow-auto rounded-md border border-gray-200 bg-gray-50 p-4 text-xs whitespace-pre-wrap text-gray-800'>
            {dryRunLog && dryRunLog.length > 0 ? dryRunLog.join('\n') : 'No changes to sync.'}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Audit Log */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Sync Log</CardTitle>
            <CardDescription>
              {totalRuns} total run{totalRuns !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant='ghost' size='sm' onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <SyncLogTable runs={runs} loading={loading} onViewDetail={handleViewDetail} />
        </CardContent>
      </Card>
    </div>
  );
}

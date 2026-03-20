import { type ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { AuditLog } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { formatDate } from '@/lib/utils';

type AuditLogWithUser = AuditLog & {
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  reason?: string | null;
};

const actionColors: Record<string, 'default' | 'secondary' | 'destructive' | 'success'> = {
  create: 'success',
  update: 'default',
  delete: 'destructive',
  approve: 'success',
  reject: 'destructive',
  login: 'secondary',
  export: 'secondary',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAuditLogColumns(): ColumnDef<AuditLogWithUser>[] {
  return [
    {
      accessorKey: 'created_at',
      header: 'Date & Time',
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return (
          <div>
            <p className="font-medium">{formatDate(date)}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(date).toLocaleTimeString()}
            </p>
          </div>
        );
      },
    },
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return <span className="text-muted-foreground">System</span>;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.getValue('action') as string;
        return (
          <Badge variant={actionColors[action] ?? 'default'}>
            {action.charAt(0).toUpperCase() + action.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ row }) => {
        const module = row.getValue('module') as string;
        return module.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      },
    },
    {
      accessorKey: 'entity_type',
      header: 'Entity Type',
      cell: ({ row }) => {
        const entityType = row.getValue('entity_type') as string;
        return entityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      },
    },
    {
      accessorKey: 'entity_id',
      header: 'Entity ID',
      cell: ({ row }) => {
        const id = row.getValue('entity_id') as string;
        return (
          <span className="font-mono text-xs" title={id}>
            {id.slice(0, 8)}...
          </span>
        );
      },
    },
    {
      id: 'reason',
      header: 'Reason',
      cell: ({ row }) => {
        const reason =
          (row.original as AuditLogWithUser).reason ??
          (row.original.new_values as Record<string, unknown> | null)?.reason ??
          null;
        if (!reason) return <span className="text-muted-foreground">-</span>;
        return <span className="text-sm">{String(reason)}</span>;
      },
    },
    {
      id: 'changes',
      header: 'Changes',
      cell: ({ row }) => {
        const oldValues = row.original.old_values;
        const newValues = row.original.new_values;
        const hasChanges = oldValues || newValues;

        if (!hasChanges) {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <details className="cursor-pointer">
            <summary className="flex items-center gap-1 text-sm text-primary">
              <ChevronRight className="h-3 w-3 details-open:hidden" />
              <ChevronDown className="hidden h-3 w-3 details-open:block" />
              View changes
            </summary>
            <div className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
              {oldValues && (
                <div className="mb-1">
                  <span className="font-semibold text-red-600">Old:</span>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(oldValues, null, 2)}</pre>
                </div>
              )}
              {newValues && (
                <div>
                  <span className="font-semibold text-green-600">New:</span>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(newValues, null, 2)}</pre>
                </div>
              )}
            </div>
          </details>
        );
      },
    },
  ];
}

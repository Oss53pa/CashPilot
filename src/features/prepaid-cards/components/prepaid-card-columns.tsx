import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { formatAccountNumber } from '@/lib/format';
import type { PrepaidCard } from '../types';

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  corporate: 'default',
  gift: 'secondary',
  travel: 'outline',
};

interface ColumnActions {
  onEdit: (card: PrepaidCard) => void;
  onDelete: (card: PrepaidCard) => void;
}

export function getPrepaidCardColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<PrepaidCard>[] {
  return [
    {
      accessorKey: 'card_number',
      header: 'Card Number',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {formatAccountNumber(row.getValue('card_number'))}
        </span>
      ),
    },
    {
      accessorKey: 'holder_name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Holder
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue('holder_name')}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge variant={typeBadgeVariant[type] ?? 'default'}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'limit',
      header: 'Limit',
      cell: ({ row }) => (
        <CurrencyDisplay amount={row.original.limit} currency={row.original.currency} />
      ),
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => (
        <CurrencyDisplay amount={row.original.balance} currency={row.original.currency} />
      ),
    },
    {
      id: 'utilization',
      header: 'Utilization',
      cell: ({ row }) => {
        const limit = row.original.limit;
        const balance = row.original.balance;
        const used = limit - balance;
        const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={pct} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'expiry_date',
      header: 'Expiry',
      cell: ({ row }) => {
        const date = row.original.expiry_date;
        return <span>{new Date(date).toLocaleDateString()}</span>;
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.is_active;
        const expiry = new Date(row.original.expiry_date);
        const isExpired = expiry < new Date();

        if (isExpired) return <Badge variant="destructive">Expired</Badge>;
        if (!isActive) return <Badge variant="secondary">Inactive</Badge>;
        return <Badge variant="success">Active</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

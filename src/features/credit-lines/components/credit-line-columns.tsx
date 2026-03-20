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
import type { CreditLine } from '../types';

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'warning'> = {
  overdraft: 'default',
  revolving: 'secondary',
  guarantee: 'outline',
  letter_of_credit: 'warning',
};

const typeLabels: Record<string, string> = {
  overdraft: 'Overdraft',
  revolving: 'Revolving',
  guarantee: 'Guarantee',
  letter_of_credit: 'Letter of Credit',
};

interface ColumnActions {
  onEdit: (creditLine: CreditLine) => void;
  onDelete: (creditLine: CreditLine) => void;
}

export function getCreditLineColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<CreditLine>[] {
  return [
    {
      accessorKey: 'bank_name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Bank
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue('bank_name')}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge variant={typeBadgeVariant[type] ?? 'default'}>
            {typeLabels[type] ?? type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'limit_amount',
      header: 'Limit',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.limit_amount}
          currency={row.original.currency}
        />
      ),
    },
    {
      accessorKey: 'used_amount',
      header: 'Used',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.used_amount}
          currency={row.original.currency}
        />
      ),
    },
    {
      id: 'utilization',
      header: 'Utilization',
      cell: ({ row }) => {
        const limit = row.original.limit_amount;
        const used = row.original.used_amount;
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
      accessorKey: 'currency',
      header: 'Currency',
    },
    {
      accessorKey: 'interest_rate',
      header: 'Rate',
      cell: ({ row }) => <span>{row.original.interest_rate}%</span>,
    },
    {
      accessorKey: 'expiry_date',
      header: 'Expiry Date',
      cell: ({ row }) => {
        const date = row.original.expiry_date;
        return <span>{new Date(date).toLocaleDateString()}</span>;
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const expiry = new Date(row.original.expiry_date);
        const now = new Date();
        const isExpired = expiry < now;
        const isExpiringSoon =
          !isExpired && expiry.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000;

        if (isExpired) return <Badge variant="destructive">Expired</Badge>;
        if (isExpiringSoon) return <Badge variant="warning">Expiring Soon</Badge>;
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

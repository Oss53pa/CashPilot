import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, CheckCircle, XCircle, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { Transfer } from '../types';

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'warning'> = {
  internal: 'default',
  intercompany: 'secondary',
  cash_to_bank: 'outline',
  bank_to_cash: 'outline',
  mobile_money: 'warning',
};

const typeLabels: Record<string, string> = {
  internal: 'Internal',
  intercompany: 'Intercompany',
  cash_to_bank: 'Cash to Bank',
  bank_to_cash: 'Bank to Cash',
  mobile_money: 'Mobile Money',
};

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  pending_validation: 'secondary',
  validated: 'default',
  in_transit: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_validation: 'Pending Validation',
  validated: 'Validated',
  in_transit: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface ColumnActions {
  onEdit: (transfer: Transfer) => void;
  onValidate: (transfer: Transfer) => void;
  onComplete: (transfer: Transfer) => void;
  onCancel: (transfer: Transfer) => void;
}

export function getTransferColumns({
  onEdit,
  onValidate,
  onComplete,
  onCancel,
}: ColumnActions): ColumnDef<Transfer>[] {
  return [
    {
      accessorKey: 'reference',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Reference
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue('reference') || '-'}</span>
      ),
    },
    {
      accessorKey: 'transfer_type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('transfer_type') as string;
        return (
          <Badge variant={typeBadgeVariant[type] ?? 'default'}>
            {typeLabels[type] ?? type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <CurrencyDisplay amount={row.original.amount} currency={row.original.currency} />
      ),
    },
    {
      accessorKey: 'transfer_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Transfer Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span>{new Date(row.original.transfer_date).toLocaleDateString()}</span>
      ),
    },
    {
      accessorKey: 'value_date',
      header: 'Value Date',
      cell: ({ row }) => (
        <span>
          {row.original.value_date
            ? new Date(row.original.value_date).toLocaleDateString()
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={statusBadgeVariant[status] ?? 'default'}>
            {statusLabels[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block">
          {row.original.description || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const transfer = row.original;
        const canEdit = transfer.status === 'draft';
        const canValidate = transfer.status === 'draft' || transfer.status === 'pending_validation';
        const canComplete = transfer.status === 'validated' || transfer.status === 'in_transit';
        const canCancel = transfer.status !== 'completed' && transfer.status !== 'cancelled';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(transfer)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canValidate && (
                <DropdownMenuItem onClick={() => onValidate(transfer)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Validate
                </DropdownMenuItem>
              )}
              {canComplete && (
                <DropdownMenuItem onClick={() => onComplete(transfer)}>
                  <Send className="mr-2 h-4 w-4" />
                  Complete
                </DropdownMenuItem>
              )}
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onCancel(transfer)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

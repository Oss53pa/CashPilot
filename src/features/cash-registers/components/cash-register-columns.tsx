import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { BankAccount } from '@/types/database';

interface ColumnActions {
  onEdit: (register: BankAccount) => void;
  onDelete: (register: BankAccount) => void;
}

export function getCashRegisterColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<BankAccount>[] {
  return [
    {
      accessorKey: 'bank_name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue('bank_name')}</span>,
    },
    {
      accessorKey: 'account_type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('account_type') as string;
        return (
          <Badge variant={type === 'cash' ? 'default' : 'secondary'}>
            {type === 'cash' ? 'Caisse' : 'Mobile Money'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'currency',
      header: 'Currency',
    },
    {
      accessorKey: 'current_balance',
      header: 'Balance',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.current_balance}
          currency={row.original.currency}
          colorize
        />
      ),
    },
    {
      accessorKey: 'account_number',
      header: 'Operator / Phone',
      cell: ({ row }) => {
        const type = row.original.account_type;
        if (type === 'mobile_money') {
          return <span className="text-sm">{row.original.account_number}</span>;
        }
        return <span className="text-muted-foreground text-sm">-</span>;
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
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

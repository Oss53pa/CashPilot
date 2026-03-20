import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Investment } from '../types';

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'warning'> = {
  term_deposit: 'default',
  treasury_bill: 'secondary',
  bond: 'outline',
  money_market: 'warning',
  certificate_of_deposit: 'default',
  other: 'secondary',
};

const typeLabels: Record<string, string> = {
  term_deposit: 'Term Deposit',
  treasury_bill: 'Treasury Bill',
  bond: 'Bond',
  money_market: 'Money Market',
  certificate_of_deposit: 'CD',
  other: 'Other',
};

function getDaysToMaturity(maturityDate: string): number {
  const now = new Date();
  const maturity = new Date(maturityDate);
  const diffMs = maturity.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getInvestmentStatus(maturityDate: string): string {
  const days = getDaysToMaturity(maturityDate);
  if (days < 0) return 'matured';
  if (days <= 30) return 'upcoming';
  return 'active';
}

interface ColumnActions {
  onEdit: (investment: Investment) => void;
  onDelete: (investment: Investment) => void;
}

export function getInvestmentColumns({ onEdit, onDelete }: ColumnActions): ColumnDef<Investment>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
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
      accessorKey: 'institution',
      header: 'Institution',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <CurrencyDisplay amount={row.original.amount} currency={row.original.currency} />
      ),
    },
    {
      accessorKey: 'interest_rate',
      header: 'Rate',
      cell: ({ row }) => <span>{row.original.interest_rate}%</span>,
    },
    {
      accessorKey: 'maturity_date',
      header: 'Maturity',
      cell: ({ row }) => <span>{new Date(row.original.maturity_date).toLocaleDateString()}</span>,
    },
    {
      id: 'days_to_maturity',
      header: 'Days Left',
      cell: ({ row }) => {
        const days = getDaysToMaturity(row.original.maturity_date);
        return (
          <span className={days <= 30 ? 'text-orange-600 font-medium' : days < 0 ? 'text-red-600' : ''}>
            {days < 0 ? 'Matured' : `${days}d`}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = getInvestmentStatus(row.original.maturity_date);
        return <StatusBadge status={status} />;
      },
    },
    {
      accessorKey: 'auto_renew',
      header: 'Auto Renew',
      cell: ({ row }) => (
        row.original.auto_renew ? (
          <RefreshCw className="h-4 w-4 text-green-600" />
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )
      ),
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

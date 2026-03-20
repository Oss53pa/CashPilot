import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, ChevronDown } from 'lucide-react';

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
import type { DebtContract } from '../types';

const typeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'warning'> = {
  term_loan: 'default',
  credit_facility: 'secondary',
  bond: 'outline',
  leasing: 'warning',
  syndicated_loan: 'default',
  other: 'secondary',
};

const typeLabels: Record<string, string> = {
  term_loan: 'Term Loan',
  credit_facility: 'Credit Facility',
  bond: 'Bond',
  leasing: 'Leasing',
  syndicated_loan: 'Syndicated',
  other: 'Other',
};

const frequencyLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
  bullet: 'Bullet',
};

function getDebtStatus(maturityDate: string, outstandingAmount: number): string {
  if (outstandingAmount <= 0) return 'paid';
  const now = new Date();
  const maturity = new Date(maturityDate);
  if (maturity < now) return 'overdue';
  const daysToMaturity = Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysToMaturity <= 90) return 'upcoming';
  return 'active';
}

interface ColumnActions {
  onEdit: (contract: DebtContract) => void;
  onDelete: (contract: DebtContract) => void;
  onExpand: (contract: DebtContract) => void;
}

export function getDebtColumns({ onEdit, onDelete, onExpand }: ColumnActions): ColumnDef<DebtContract>[] {
  return [
    {
      id: 'expand',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onExpand(row.original)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'lender',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Lender
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue('lender')}</span>,
    },
    {
      accessorKey: 'contract_reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue('contract_reference')}</span>
      ),
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
      accessorKey: 'principal_amount',
      header: 'Principal',
      cell: ({ row }) => (
        <CurrencyDisplay amount={row.original.principal_amount} currency={row.original.currency} />
      ),
    },
    {
      accessorKey: 'outstanding_amount',
      header: 'Outstanding',
      cell: ({ row }) => (
        <CurrencyDisplay amount={row.original.outstanding_amount} currency={row.original.currency} />
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
      accessorKey: 'payment_frequency',
      header: 'Frequency',
      cell: ({ row }) => {
        const freq = row.getValue('payment_frequency') as string;
        return <span>{frequencyLabels[freq] ?? freq}</span>;
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = getDebtStatus(row.original.maturity_date, row.original.outstanding_amount);
        return <StatusBadge status={status} />;
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

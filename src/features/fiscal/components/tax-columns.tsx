import { type ColumnDef } from '@tanstack/react-table';
import type { TaxObligation } from '@/types/database';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColumnOptions {
  onEdit: (obligation: TaxObligation) => void;
  onDelete: (id: string) => void;
}

export function getTaxColumns({
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<TaxObligation>[] {
  return [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.type.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'period',
      header: 'Period',
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => new Date(row.original.due_date).toLocaleDateString('fr-FR'),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.amount}
          currency={row.original.currency}
        />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'paid_date',
      header: 'Paid Date',
      cell: ({ row }) =>
        row.original.paid_date
          ? new Date(row.original.paid_date).toLocaleDateString('fr-FR')
          : '-',
    },
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => row.original.reference ?? '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const obligation = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(obligation)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(obligation.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

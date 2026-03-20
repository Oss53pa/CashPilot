import { type ColumnDef } from '@tanstack/react-table';
import type { CashFlow, Counterparty } from '@/types/database';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColumnOptions {
  counterparties: Counterparty[];
  onValidate: (id: string) => void;
  onEdit: (flow: CashFlow) => void;
  onDelete: (id: string) => void;
}

export function getCashFlowColumns({
  counterparties,
  onValidate,
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<CashFlow>[] {
  const counterpartyMap = new Map(counterparties.map((c) => [c.id, c.name]));

  return [
    {
      accessorKey: 'operation_date',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.operation_date).toLocaleDateString('fr-FR'),
    },
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => row.original.reference ?? '-',
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) =>
        row.original.category
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    {
      accessorKey: 'counterparty_id',
      header: 'Counterparty',
      cell: ({ row }) =>
        row.original.counterparty_id
          ? counterpartyMap.get(row.original.counterparty_id) ?? '-'
          : '-',
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
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const flow = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {flow.status === 'pending' && (
                <DropdownMenuItem onClick={() => onValidate(flow.id)}>
                  Validate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(flow)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(flow.id)}
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

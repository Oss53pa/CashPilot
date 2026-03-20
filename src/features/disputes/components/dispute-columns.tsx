import { type ColumnDef } from '@tanstack/react-table';
import type { DisputeFile, Counterparty } from '@/types/database';
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
  counterparties: Counterparty[];
  onEdit: (dispute: DisputeFile) => void;
  onDelete: (id: string) => void;
}

export function getDisputeColumns({
  counterparties,
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<DisputeFile>[] {
  const counterpartyMap = new Map(counterparties.map((c) => [c.id, c.name]));

  return [
    {
      accessorKey: 'reference',
      header: 'Reference',
    },
    {
      accessorKey: 'counterparty_id',
      header: 'Counterparty',
      cell: ({ row }) =>
        counterpartyMap.get(row.original.counterparty_id) ?? '-',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.type.replace(/\b\w/g, (c) => c.toUpperCase())}
        </Badge>
      ),
    },
    {
      accessorKey: 'amount_disputed',
      header: 'Amount Disputed',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.amount_disputed}
          currency={row.original.currency}
        />
      ),
    },
    {
      accessorKey: 'amount_provision',
      header: 'Provision',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.amount_provision}
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
      accessorKey: 'opened_date',
      header: 'Opened',
      cell: ({ row }) => new Date(row.original.opened_date).toLocaleDateString('fr-FR'),
    },
    {
      accessorKey: 'next_hearing',
      header: 'Next Hearing',
      cell: ({ row }) =>
        row.original.next_hearing
          ? new Date(row.original.next_hearing).toLocaleDateString('fr-FR')
          : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const dispute = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(dispute)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(dispute.id)}
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

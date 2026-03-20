import { type ColumnDef } from '@tanstack/react-table';
import type { InternalTransfer, BankAccount } from '@/types/database';
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
  bankAccounts: BankAccount[];
  onEdit: (transfer: InternalTransfer) => void;
  onDelete: (id: string) => void;
}

export function getTransferColumns({
  bankAccounts,
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<InternalTransfer>[] {
  const accountMap = new Map(
    bankAccounts.map((a) => [a.id, `${a.bank_name} - ${a.account_name}`]),
  );

  return [
    {
      accessorKey: 'execution_date',
      header: 'Date',
      cell: ({ row }) =>
        new Date(row.original.execution_date).toLocaleDateString('fr-FR'),
    },
    {
      accessorKey: 'from_account_id',
      header: 'From Account',
      cell: ({ row }) =>
        accountMap.get(row.original.from_account_id) ?? row.original.from_account_id,
    },
    {
      accessorKey: 'to_account_id',
      header: 'To Account',
      cell: ({ row }) =>
        accountMap.get(row.original.to_account_id) ?? row.original.to_account_id,
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
      accessorKey: 'currency',
      header: 'Currency',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
        const transfer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(transfer)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(transfer.id)}
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

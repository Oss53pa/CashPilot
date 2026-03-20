import { type ColumnDef } from '@tanstack/react-table';
import type { PaymentRequest, Counterparty } from '@/types/database';
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
  showApprovalActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit: (request: PaymentRequest) => void;
  onDelete: (id: string) => void;
}

const priorityVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  low: 'secondary',
  medium: 'default',
  high: 'default',
  urgent: 'destructive',
};

export function getPaymentColumns({
  counterparties,
  showApprovalActions = false,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<PaymentRequest>[] {
  const counterpartyMap = new Map(counterparties.map((c) => [c.id, c.name]));

  return [
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString('fr-FR'),
    },
    {
      accessorKey: 'requester_id',
      header: 'Requester',
      cell: ({ row }) => row.original.requester_id,
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
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) =>
        row.original.category
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={priorityVariants[row.original.priority] ?? 'default'}>
          {row.original.priority.replace(/\b\w/g, (c) => c.toUpperCase())}
        </Badge>
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
        const request = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showApprovalActions &&
                request.status === 'pending_approval' && (
                  <>
                    {onApprove && (
                      <DropdownMenuItem onClick={() => onApprove(request.id)}>
                        Approve
                      </DropdownMenuItem>
                    )}
                    {onReject && (
                      <DropdownMenuItem onClick={() => onReject(request.id)}>
                        Reject
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              <DropdownMenuItem onClick={() => onEdit(request)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(request.id)}
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

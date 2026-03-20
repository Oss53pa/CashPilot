import { type ColumnDef } from '@tanstack/react-table';
import type { CapexOperation } from '@/types/database';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColumnOptions {
  onEdit: (operation: CapexOperation) => void;
  onDelete: (id: string) => void;
  onViewDetail?: (operation: CapexOperation) => void;
}

export function getCapexColumns({
  onEdit,
  onDelete,
  onViewDetail,
}: ColumnOptions): ColumnDef<CapexOperation>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.category.replace(/\b\w/g, (c) => c.toUpperCase())}
        </Badge>
      ),
    },
    {
      accessorKey: 'budget_amount',
      header: 'Budget',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.budget_amount}
          currency={row.original.currency}
        />
      ),
    },
    {
      accessorKey: 'committed_amount',
      header: 'Committed',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.committed_amount}
          currency={row.original.currency}
        />
      ),
    },
    {
      accessorKey: 'spent_amount',
      header: 'Spent',
      cell: ({ row }) => (
        <CurrencyDisplay
          amount={row.original.spent_amount}
          currency={row.original.currency}
        />
      ),
    },
    {
      id: 'progress',
      header: 'Progress',
      cell: ({ row }) => {
        const progress =
          row.original.budget_amount > 0
            ? Math.round((row.original.spent_amount / row.original.budget_amount) * 100)
            : 0;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={progress} className="flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {progress}%
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'start_date',
      header: 'Start',
      cell: ({ row }) => new Date(row.original.start_date).toLocaleDateString('fr-FR'),
    },
    {
      accessorKey: 'end_date',
      header: 'End',
      cell: ({ row }) =>
        row.original.end_date
          ? new Date(row.original.end_date).toLocaleDateString('fr-FR')
          : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const operation = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewDetail && (
                <DropdownMenuItem onClick={() => onViewDetail(operation)}>
                  View Detail
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(operation)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(operation.id)}
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

import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import type { Budget, BudgetLine } from '@/types/database';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';

type BudgetWithLines = Budget & { budget_lines: BudgetLine[] };

function computeTotals(lines: BudgetLine[]) {
  const months = [
    'month_01', 'month_02', 'month_03', 'month_04',
    'month_05', 'month_06', 'month_07', 'month_08',
    'month_09', 'month_10', 'month_11', 'month_12',
  ] as const;

  let receipts = 0;
  let disbursements = 0;

  for (const line of lines) {
    const total = months.reduce((sum, m) => sum + (line[m] ?? 0), 0);
    if (line.type === 'receipt') receipts += total;
    else disbursements += total;
  }

  return { receipts, disbursements, net: receipts - disbursements };
}

interface BudgetColumnsOptions {
  onEdit?: (budget: BudgetWithLines) => void;
  onDelete?: (budget: BudgetWithLines) => void;
  currency?: string;
}

export function getBudgetColumns({
  onEdit,
  onDelete,
  currency = 'USD',
}: BudgetColumnsOptions = {}): ColumnDef<BudgetWithLines>[] {
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
    },
    {
      accessorKey: 'fiscal_year',
      header: 'Fiscal Year',
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => `v${row.getValue('version')}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      id: 'total_receipts',
      header: 'Receipts',
      cell: ({ row }) => {
        const { receipts } = computeTotals(row.original.budget_lines ?? []);
        return <span className="text-green-600">{formatCurrency(receipts, currency)}</span>;
      },
    },
    {
      id: 'total_disbursements',
      header: 'Disbursements',
      cell: ({ row }) => {
        const { disbursements } = computeTotals(row.original.budget_lines ?? []);
        return <span className="text-red-600">{formatCurrency(disbursements, currency)}</span>;
      },
    },
    {
      id: 'net',
      header: 'Net',
      cell: ({ row }) => {
        const { net } = computeTotals(row.original.budget_lines ?? []);
        return (
          <span className={net >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(net, currency)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(row.original)}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

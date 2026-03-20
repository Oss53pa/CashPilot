import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import type { Counterparty } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CounterpartyColumnsOptions {
  onEdit?: (counterparty: Counterparty) => void;
  onDelete?: (counterparty: Counterparty) => void;
  onView?: (counterparty: Counterparty) => void;
}

const typeVariantMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
  customer: 'default',
  supplier: 'secondary',
  employee: 'default',
  government: 'secondary',
  other: 'default',
};

export function getCounterpartyColumns({
  onEdit,
  onDelete,
  onView,
}: CounterpartyColumnsOptions = {}): ColumnDef<Counterparty>[] {
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
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge variant={typeVariantMap[type] ?? 'default'}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.getValue('email') ?? '-',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.getValue('phone') ?? '-',
    },
    {
      accessorKey: 'payment_terms',
      header: 'Payment Terms',
      cell: ({ row }) => {
        const days = row.getValue('payment_terms') as number;
        return `${days} days`;
      },
    },
    {
      accessorKey: 'scoring',
      header: 'Scoring',
      cell: ({ row }) => {
        const scoring = row.original.scoring;
        if (scoring == null) return '-';
        return (
          <div className="flex items-center gap-2">
            <Progress value={scoring} className="h-2 w-16" />
            <span className="text-sm text-muted-foreground">{scoring}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => (
        <Badge variant={row.getValue('is_active') ? 'success' : 'destructive'}>
          {row.getValue('is_active') ? 'Active' : 'Inactive'}
        </Badge>
      ),
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
            {onView && (
              <DropdownMenuItem onClick={() => onView(row.original)}>
                View Profile
              </DropdownMenuItem>
            )}
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

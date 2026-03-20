import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import type { Forecast } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ForecastColumnsOptions {
  onEdit?: (forecast: Forecast) => void;
  onDelete?: (forecast: Forecast) => void;
  currency?: string;
}

const horizonColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  daily: 'default',
  weekly: 'secondary',
  monthly: 'default',
  quarterly: 'secondary',
};

const sourceColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  manual: 'default',
  recurring: 'secondary',
  ai: 'default',
};

export function getForecastColumns({
  onEdit,
  onDelete,
  currency = 'USD',
}: ForecastColumnsOptions = {}): ColumnDef<Forecast>[] {
  return [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <span className={type === 'receipt' ? 'text-green-600' : 'text-red-600'}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.getValue('amount') as number;
        const type = row.original.type;
        return (
          <span className={type === 'receipt' ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(amount, currency)}
          </span>
        );
      },
    },
    {
      accessorKey: 'forecast_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.getValue('forecast_date')),
    },
    {
      accessorKey: 'horizon',
      header: 'Horizon',
      cell: ({ row }) => {
        const horizon = row.getValue('horizon') as string;
        return (
          <Badge variant={horizonColors[horizon] ?? 'default'}>
            {horizon.charAt(0).toUpperCase() + horizon.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'confidence',
      header: 'Confidence',
      cell: ({ row }) => {
        const confidence = row.getValue('confidence') as number;
        return (
          <div className="flex items-center gap-2">
            <Progress value={confidence} className="h-2 w-16" />
            <span className="text-sm text-muted-foreground">{confidence}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => {
        const source = row.getValue('source') as string;
        return (
          <Badge variant={sourceColors[source] ?? 'default'}>
            {source === 'ai' ? 'AI' : source.charAt(0).toUpperCase() + source.slice(1)}
          </Badge>
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

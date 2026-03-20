'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';

interface DateRangePickerProps {
  from: Date | undefined;
  to: Date | undefined;
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

function formatDate(date: Date | undefined): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toInputValue(date: Date | undefined): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const label =
    from && to
      ? `${formatDate(from)} - ${formatDate(to)}`
      : from
        ? `${formatDate(from)} - ...`
        : 'Select date range';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <CalendarDays className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <input
              type="date"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={toInputValue(from)}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ from: val ? new Date(val + 'T00:00:00') : undefined, to });
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <input
              type="date"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={toInputValue(to)}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ from, to: val ? new Date(val + 'T00:00:00') : undefined });
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

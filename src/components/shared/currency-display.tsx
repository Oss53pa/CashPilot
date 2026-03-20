import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  colorize?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = 'USD',
  className,
  colorize = false,
}: CurrencyDisplayProps) {
  const formatted = formatAmount(amount, currency);

  const colorClass = colorize
    ? amount > 0
      ? 'text-green-600'
      : amount < 0
        ? 'text-red-600'
        : ''
    : '';

  return <span className={cn(colorClass, className)}>{formatted}</span>;
}

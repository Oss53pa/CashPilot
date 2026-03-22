import { formatAmount } from "@/lib/format";
import { formatFrancs } from "@/utils/currency";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  /** Amount in the currency's base unit (francs for XOF, dollars for USD, etc.) */
  amount: number;
  currency?: string;
  className?: string;
  colorize?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = "USD",
  className,
  colorize = false,
}: CurrencyDisplayProps) {
  // For XOF (FCFA), use the centralized FCFA formatter for consistent output
  const formatted =
    currency === "XOF" ? formatFrancs(amount) : formatAmount(amount, currency);

  const colorClass = colorize
    ? amount > 0
      ? "text-green-600"
      : amount < 0
        ? "text-red-600"
        : ""
    : "";

  return <span className={cn(colorClass, className)}>{formatted}</span>;
}

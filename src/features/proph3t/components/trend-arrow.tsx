import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoreTrend } from '@/types/proph3t';

interface TrendArrowProps {
  trend: ScoreTrend;
  delta?: number;
  className?: string;
}

const trendConfig: Record<ScoreTrend, { icon: React.ElementType; color: string; label: string }> = {
  improving: { icon: TrendingUp, color: 'text-green-600', label: 'En hausse' },
  stable: { icon: Minus, color: 'text-gray-500', label: 'Stable' },
  degrading: { icon: TrendingDown, color: 'text-orange-500', label: 'En baisse' },
  critical_degradation: { icon: TrendingDown, color: 'text-red-600', label: 'Chute critique' },
};

export function TrendArrow({ trend, delta, className }: TrendArrowProps) {
  const config = trendConfig[trend];
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1', config.color, className)}>
      <Icon className="h-4 w-4" />
      {delta !== undefined && (
        <span className="text-xs font-medium">
          {delta > 0 ? '+' : ''}{delta}
        </span>
      )}
    </span>
  );
}

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ModelHealthBadgeProps {
  mape: number;
  className?: string;
}

export function ModelHealthBadge({ mape, className }: ModelHealthBadgeProps) {
  const mapePercent = mape * 100;

  if (mapePercent < 10) {
    return (
      <Badge variant="success" className={cn(className)}>
        {mapePercent.toFixed(1)}%
      </Badge>
    );
  }
  if (mapePercent < 20) {
    return (
      <Badge variant="warning" className={cn(className)}>
        {mapePercent.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className={cn(className)}>
      {mapePercent.toFixed(1)}%
    </Badge>
  );
}

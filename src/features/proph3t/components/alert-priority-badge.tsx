import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AlertPriority } from '@/types/proph3t';

const priorityConfig: Record<AlertPriority, { className: string; label: string }> = {
  critical: { className: 'bg-red-600 text-white hover:bg-red-600/80', label: 'Critique' },
  high: { className: 'bg-orange-500 text-white hover:bg-orange-500/80', label: 'Haute' },
  medium: { className: 'bg-yellow-500 text-white hover:bg-yellow-500/80', label: 'Moyenne' },
  low: { className: 'bg-blue-500 text-white hover:bg-blue-500/80', label: 'Basse' },
};

interface AlertPriorityBadgeProps {
  priority: AlertPriority;
  className?: string;
}

export function AlertPriorityBadge({ priority, className }: AlertPriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

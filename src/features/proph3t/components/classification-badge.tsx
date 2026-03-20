import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ScoreClassification } from '@/types/proph3t';

const classificationConfig: Record<ScoreClassification, { className: string; label: string }> = {
  excellent: { className: 'bg-green-600 text-white hover:bg-green-600/80', label: 'Excellent' },
  good: { className: 'bg-lime-500 text-white hover:bg-lime-500/80', label: 'Bon' },
  watch: { className: 'bg-yellow-500 text-white hover:bg-yellow-500/80', label: 'À surveiller' },
  at_risk: { className: 'bg-orange-500 text-white hover:bg-orange-500/80', label: 'À risque' },
  critical: { className: 'bg-red-600 text-white hover:bg-red-600/80', label: 'Critique' },
};

interface ClassificationBadgeProps {
  classification: ScoreClassification;
  className?: string;
}

export function ClassificationBadge({ classification, className }: ClassificationBadgeProps) {
  const config = classificationConfig[classification];
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

import { cn } from '@/lib/utils';
import type { NarrativeSentiment } from '@/types/proph3t';

const sentimentConfig: Record<NarrativeSentiment, { color: string; label: string }> = {
  positive: { color: 'bg-green-500', label: 'Positif' },
  neutral: { color: 'bg-gray-400', label: 'Neutre' },
  warning: { color: 'bg-yellow-500', label: 'Attention' },
  critical: { color: 'bg-red-500', label: 'Critique' },
};

interface SentimentIndicatorProps {
  sentiment: NarrativeSentiment;
  showLabel?: boolean;
  className?: string;
}

export function SentimentIndicator({ sentiment, showLabel = true, className }: SentimentIndicatorProps) {
  const config = sentimentConfig[sentiment];
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('h-2.5 w-2.5 rounded-full', config.color)} />
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </span>
  );
}

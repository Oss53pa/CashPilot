import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreGauge({ score, size = 'md', className }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80 ? '#22c55e' :
    clamped >= 65 ? '#84cc16' :
    clamped >= 50 ? '#eab308' :
    clamped >= 35 ? '#f97316' :
    '#ef4444';

  const sizeMap = { sm: 60, md: 90, lg: 120 };
  const s = sizeMap[size];
  const fontSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-3xl';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: s, height: s }}>
      <svg width={s} height={s} viewBox="0 0 100 100" className="-rotate-90">
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn('absolute font-bold', fontSize)} style={{ color }}>
        {clamped}
      </span>
    </div>
  );
}

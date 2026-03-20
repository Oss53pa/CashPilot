import { cn } from '@/lib/utils';

interface FraudScoreGaugeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FraudScoreGauge({ score, size = 'md', className }: FraudScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180;

  const sizeMap = {
    sm: { width: 80, height: 48, strokeWidth: 6, fontSize: 'text-sm' },
    md: { width: 120, height: 68, strokeWidth: 8, fontSize: 'text-xl' },
    lg: { width: 160, height: 88, strokeWidth: 10, fontSize: 'text-3xl' },
  };
  const s = sizeMap[size];
  const radius = (s.width - s.strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (angle / 180) * circumference;

  const color =
    clamped >= 75 ? '#ef4444' :
    clamped >= 50 ? '#f97316' :
    clamped >= 25 ? '#eab308' :
    '#22c55e';

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width={s.width}
        height={s.height}
        viewBox={`0 0 ${s.width} ${s.height}`}
      >
        {/* Background arc */}
        <path
          d={`M ${s.strokeWidth / 2} ${s.height - 4} A ${radius} ${radius} 0 0 1 ${s.width - s.strokeWidth / 2} ${s.height - 4}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={s.strokeWidth}
          className="text-muted"
        />
        {/* Score arc */}
        <path
          d={`M ${s.strokeWidth / 2} ${s.height - 4} A ${radius} ${radius} 0 0 1 ${s.width - s.strokeWidth / 2} ${s.height - 4}`}
          fill="none"
          stroke={color}
          strokeWidth={s.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn('font-bold -mt-2', s.fontSize)} style={{ color }}>
        {clamped}
      </span>
    </div>
  );
}

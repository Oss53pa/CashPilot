import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AnomalySeverity, FraudSeverity } from '@/types/proph3t';

const severityConfig: Record<string, { variant: 'default' | 'secondary' | 'warning' | 'destructive' | 'outline'; className: string }> = {
  normal: { variant: 'secondary', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100/80' },
  watch: { variant: 'outline', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
  alert: { variant: 'warning', className: '' },
  critical: { variant: 'destructive', className: '' },
  medium: { variant: 'warning', className: '' },
  high: { variant: 'destructive', className: 'bg-orange-600 hover:bg-orange-600/80' },
};

interface SeverityBadgeProps {
  severity: AnomalySeverity | FraudSeverity | string;
  label?: string;
  className?: string;
}

export function SeverityBadge({ severity, label, className }: SeverityBadgeProps) {
  const config = severityConfig[severity] ?? severityConfig.normal;
  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {label ?? severity}
    </Badge>
  );
}

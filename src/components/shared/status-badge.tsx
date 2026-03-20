import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

const statusVariantMap: Record<string, 'success' | 'default' | 'destructive' | 'secondary'> = {
  approved: 'success',
  active: 'success',
  validated: 'success',
  reconciled: 'success',
  paid: 'success',
  pending: 'default',
  draft: 'default',
  submitted: 'default',
  upcoming: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
  overdue: 'destructive',
  defaulted: 'destructive',
  written_off: 'destructive',
  in_progress: 'secondary',
  open: 'secondary',
};

function getVariant(status: string) {
  return statusVariantMap[status.toLowerCase()] ?? 'default';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={getVariant(status)}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}

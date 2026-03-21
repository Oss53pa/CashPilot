import { differenceInDays, parseISO } from 'date-fns';

export type AgingBucket = 'not_due' | '1_30' | '31_60' | '61_90' | 'over_90';

export function getAgingBucket(dueDateISO: string, refDate: Date = new Date()): AgingBucket {
  const dueDate = parseISO(dueDateISO);
  if (dueDate > refDate) return 'not_due';
  const days = differenceInDays(refDate, dueDate);
  if (days <= 30) return '1_30';
  if (days <= 60) return '31_60';
  if (days <= 90) return '61_90';
  return 'over_90';
}

export function getAgingLabel(bucket: AgingBucket): string {
  const labels: Record<AgingBucket, string> = {
    not_due: 'Non échu',
    '1_30': '1-30 jours',
    '31_60': '31-60 jours',
    '61_90': '61-90 jours',
    over_90: '> 90 jours',
  };
  return labels[bucket];
}

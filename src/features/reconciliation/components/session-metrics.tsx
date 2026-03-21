import { BarChart3, Clock, CheckCircle2, XCircle, SkipForward, Zap, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { SessionMetrics as SessionMetricsType, SessionParticipant } from '../types';

interface SessionMetricsProps {
  metrics: SessionMetricsType;
  participants?: SessionParticipant[];
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s > 0 ? `${s.toString().padStart(2, '0')}s` : ''}`;
}

export function SessionMetricsCard({ metrics, participants }: SessionMetricsProps) {
  const totalResolved = metrics.auto_matched + metrics.manual_matched + metrics.skipped + metrics.rejected;
  const resolutionRate = metrics.total_items > 0
    ? Math.round((totalResolved / metrics.total_items) * 100)
    : 0;

  // Donut chart segments
  const segments = [
    { label: 'Auto-rapprochés', value: metrics.auto_matched, color: '#22c55e' },
    { label: 'Manuels', value: metrics.manual_matched, color: '#6366f1' },
    { label: 'En attente', value: metrics.pending, color: '#94a3b8' },
    { label: 'Ignorés', value: metrics.skipped, color: '#f59e0b' },
    { label: 'Rejetés', value: metrics.rejected, color: '#ef4444' },
  ];

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // Build SVG donut
  let cumulativePercent = 0;
  const donutSegments = segments
    .filter((s) => s.value > 0)
    .map((segment) => {
      const percent = total > 0 ? segment.value / total : 0;
      const startAngle = cumulativePercent * 360;
      const endAngle = (cumulativePercent + percent) * 360;
      cumulativePercent += percent;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;
      const largeArc = percent > 0.5 ? 1 : 0;
      const r = 40;
      const cx = 50;
      const cy = 50;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      return {
        ...segment,
        path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      };
    });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4" />
          Métriques de session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Donut chart */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {donutSegments.map((seg, idx) => (
                <path key={idx} d={seg.path} fill={seg.color} opacity={0.85} />
              ))}
              {/* Center hole */}
              <circle cx="50" cy="50" r="25" className="fill-background" />
              <text x="50" y="48" textAnchor="middle" className="fill-foreground text-[11px] font-bold">
                {resolutionRate}%
              </text>
              <text x="50" y="58" textAnchor="middle" className="fill-muted-foreground text-[7px]">
                résolu
              </text>
            </svg>
          </div>
          <div className="space-y-1">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-muted-foreground">{seg.label}</span>
                <span className="font-medium ml-auto">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Taux de résolution
            </div>
            <p className="text-lg font-bold">{resolutionRate}%</p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Temps moyen
            </div>
            <p className="text-lg font-bold">{formatDuration(metrics.avg_resolution_time_seconds)}</p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-green-500" />
              Montant réconcilié
            </div>
            <p className="text-sm font-bold text-green-600">
              {formatAmount(metrics.total_amount_reconciled)}
            </p>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <XCircle className="h-3 w-3 text-orange-500" />
              Montant en attente
            </div>
            <p className="text-sm font-bold text-orange-600">
              {formatAmount(metrics.total_amount_pending)}
            </p>
          </div>
        </div>

        {/* Per-participant stats */}
        {participants && participants.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-semibold">
              <Users className="h-3.5 w-3.5" />
              Par participant
            </div>
            {/* Mock per-participant stats based on participants */}
            {participants.map((p, idx) => {
              const resolvedCount = idx === 0 ? 8 : idx === 1 ? 7 : 4;
              return (
                <div key={p.user_id} className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs flex-1">{p.user_name}</span>
                  <span className="text-xs font-medium">{resolvedCount} résolu{resolvedCount > 1 ? 's' : ''}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

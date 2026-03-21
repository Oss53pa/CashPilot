import { AlertTriangle, Users, Gavel, Building2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { RiskSummary } from '../types';

interface RiskRowProps {
  riskSummary: RiskSummary;
}

function formatFCFA(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M FCFA`;
  }
  return `${(value / 1_000).toFixed(0)}K FCFA`;
}

export function RiskRow({ riskSummary }: RiskRowProps) {
  const items = [
    {
      icon: Users,
      label: 'Locataires à risque',
      detail: `${riskSummary.tenants_at_risk.count} locataires — ${formatFCFA(riskSummary.tenants_at_risk.monthly_amount)}/mois`,
      severity: 'high' as const,
    },
    {
      icon: Gavel,
      label: 'Contentieux attendus',
      detail: formatFCFA(riskSummary.disputes_expected),
      severity: 'medium' as const,
    },
    ...(riskSummary.capex_underfunded
      ? [
          {
            icon: Building2,
            label: 'CAPEX sous-financé',
            detail: `${formatFCFA(riskSummary.capex_underfunded.amount)} au ${new Date(riskSummary.capex_underfunded.date).toLocaleDateString('fr-FR')}`,
            severity: 'high' as const,
          },
        ]
      : []),
    ...(riskSummary.covenant_watch
      ? [
          {
            icon: ShieldAlert,
            label: riskSummary.covenant_watch.name,
            detail: `${riskSummary.covenant_watch.current.toFixed(2)}x (min ${riskSummary.covenant_watch.minimum.toFixed(2)}x)`,
            severity: (riskSummary.covenant_watch.current <= riskSummary.covenant_watch.minimum * 1.1
              ? 'high'
              : 'low') as 'high' | 'medium' | 'low',
          },
        ]
      : []),
  ];

  const severityBadge = {
    high: 'destructive' as const,
    medium: 'default' as const,
    low: 'secondary' as const,
  };

  const severityLabel = {
    high: 'Élevé',
    medium: 'Moyen',
    low: 'Faible',
  };

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-semibold">Synthèse des risques</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              className="flex items-start gap-2 rounded-md border p-2.5 text-left hover:bg-accent transition-colors"
              onClick={() => {
                // Toast/detail placeholder
              }}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{item.label}</span>
                  <Badge variant={severityBadge[item.severity]} className="text-[10px] px-1.5 py-0">
                    {severityLabel[item.severity]}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {item.detail}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

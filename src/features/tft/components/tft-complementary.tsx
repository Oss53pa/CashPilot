import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { cn } from '@/lib/utils';
import type { TFTStatement } from '../types';

// ---------------------------------------------------------------------------
// Progress bar helper
// ---------------------------------------------------------------------------

function RatioBar({ label, value, max, suffix, status }: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  status: 'positive' | 'negative' | 'neutral';
}) {
  const pct = max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;

  const barColor =
    status === 'positive'
      ? 'bg-green-500'
      : status === 'negative'
        ? 'bg-red-500'
        : 'bg-blue-500';

  const statusBadge =
    status === 'positive'
      ? 'success'
      : status === 'negative'
        ? 'destructive'
        : 'secondary';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <Badge variant={statusBadge as 'success' | 'destructive' | 'secondary'} className="text-xs">
          {value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}{suffix}
        </Badge>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TFTComplementaryProps {
  complementary: TFTStatement['complementary'];
}

export function TFTComplementary({ complementary }: TFTComplementaryProps) {
  const { non_cash_items, significant_flows, ratios } = complementary;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Section E — Informations complementaires</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Non-cash items */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Elements non monetaires
          </p>
          <div className="border rounded-lg divide-y">
            {non_cash_items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{item.label}</span>
                <CurrencyDisplay amount={item.amount} currency="XOF" colorize />
              </div>
            ))}
          </div>
        </div>

        {/* Significant flows */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Flux significatifs
          </p>
          <div className="border rounded-lg divide-y">
            {significant_flows.map((flow, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{flow.label}</p>
                  <p className="text-xs text-muted-foreground">{flow.nature}</p>
                </div>
                <CurrencyDisplay amount={flow.amount} currency="XOF" className="font-medium" />
              </div>
            ))}
          </div>
        </div>

        {/* Ratios */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Ratios de tresorerie
          </p>
          <div className="space-y-4">
            <RatioBar
              label="CF Exploitation / CA"
              value={ratios.operating_cf_to_revenue}
              max={50}
              suffix="%"
              status={ratios.operating_cf_to_revenue >= 10 ? 'positive' : 'negative'}
            />
            <RatioBar
              label="Free Cash Flow"
              value={ratios.free_cash_flow / 1_000_000}
              max={100}
              suffix="M FCFA"
              status={ratios.free_cash_flow >= 0 ? 'positive' : 'negative'}
            />
            <RatioBar
              label="Jours de tresorerie disponibles"
              value={ratios.days_cash_on_hand}
              max={365}
              suffix=" jours"
              status={ratios.days_cash_on_hand >= 90 ? 'positive' : ratios.days_cash_on_hand >= 30 ? 'neutral' : 'negative'}
            />
            <RatioBar
              label="DSCR (Debt Service Coverage Ratio)"
              value={ratios.dscr}
              max={5}
              suffix="x"
              status={ratios.dscr >= 1.2 ? 'positive' : 'negative'}
            />
            <RatioBar
              label="Cash Conversion"
              value={ratios.cash_conversion}
              max={50}
              suffix="%"
              status={ratios.cash_conversion >= 10 ? 'positive' : 'negative'}
            />
            {ratios.burn_rate != null && (
              <RatioBar
                label="Burn Rate"
                value={ratios.burn_rate / 1_000_000}
                max={50}
                suffix="M FCFA/mois"
                status="negative"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

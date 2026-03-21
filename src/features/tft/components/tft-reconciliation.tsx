import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { cn } from '@/lib/utils';
import type { TFTStatement, PositionBreakdown } from '../types';

// ---------------------------------------------------------------------------
// Breakdown row
// ---------------------------------------------------------------------------

function BreakdownRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <CurrencyDisplay amount={amount} currency="XOF" colorize />
    </div>
  );
}

function BreakdownCard({ title, breakdown, total }: { title: string; breakdown: PositionBreakdown; total: number }) {
  return (
    <div className="flex-1 border rounded-lg p-3 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <BreakdownRow label="Banque" amount={breakdown.bank} />
      <BreakdownRow label="Caisse" amount={breakdown.cash} />
      <BreakdownRow label="Mobile Money" amount={breakdown.mobile_money} />
      <BreakdownRow label="Cartes prepayees" amount={breakdown.prepaid} />
      <BreakdownRow label="Decouvert" amount={breakdown.overdraft} />
      <div className="flex items-center justify-between py-1.5 px-2 border-t mt-1 font-bold text-sm">
        <span>Total</span>
        <CurrencyDisplay amount={total} currency="XOF" className="font-bold" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TFTReconciliationProps {
  reconciliation: TFTStatement['reconciliation'];
}

export function TFTReconciliation({ reconciliation }: TFTReconciliationProps) {
  const isBalanced = reconciliation.reconciliation_variance === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Section D — Rapprochement de tresorerie</CardTitle>
          <Badge variant={isBalanced ? 'success' : 'destructive'}>
            {isBalanced ? 'Equilibre' : `Ecart : ${reconciliation.reconciliation_variance.toLocaleString('fr-FR')} FCFA`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Net flows summary */}
        <div className="border rounded-lg divide-y">
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>Flux net d'exploitation (A)</span>
            <CurrencyDisplay amount={reconciliation.net_exploitation} currency="XOF" colorize className="font-medium" />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>Flux net d'investissement (B)</span>
            <CurrencyDisplay amount={reconciliation.net_investment} currency="XOF" colorize className="font-medium" />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>Flux net de financement (C)</span>
            <CurrencyDisplay amount={reconciliation.net_financing} currency="XOF" colorize className="font-medium" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-muted/50 font-bold text-sm">
            <span>Variation nette de tresorerie (A + B + C)</span>
            <CurrencyDisplay amount={reconciliation.net_variation} currency="XOF" colorize className="font-bold" />
          </div>
        </div>

        {/* Position breakdowns */}
        <div className="flex flex-col md:flex-row gap-4">
          <BreakdownCard
            title="Position d'ouverture"
            breakdown={reconciliation.opening_breakdown}
            total={reconciliation.opening_position}
          />
          <BreakdownCard
            title="Position de cloture"
            breakdown={reconciliation.closing_breakdown}
            total={reconciliation.closing_position}
          />
        </div>

        {/* Reconciliation check */}
        <div className={cn(
          'flex items-center justify-between px-4 py-3 rounded-lg border-2',
          isBalanced ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
        )}>
          <span className="text-sm font-medium">
            Controle : Cloture - Ouverture - Variation
          </span>
          <div className="flex items-center gap-2">
            <CurrencyDisplay
              amount={reconciliation.reconciliation_variance}
              currency="XOF"
              className={cn('font-bold', isBalanced ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}
            />
            {isBalanced ? (
              <Badge variant="success">OK</Badge>
            ) : (
              <Badge variant="destructive">Ecart</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

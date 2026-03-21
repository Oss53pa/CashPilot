import { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Banknote, Coins } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================================================
// FCFA Denominations
// ============================================================================

const BILLS = [
  { value: 10000, label: '10 000 FCFA' },
  { value: 5000, label: '5 000 FCFA' },
  { value: 2000, label: '2 000 FCFA' },
  { value: 1000, label: '1 000 FCFA' },
  { value: 500, label: '500 FCFA' },
];

const COINS = [
  { value: 500, label: '500 FCFA' },
  { value: 200, label: '200 FCFA' },
  { value: 100, label: '100 FCFA' },
  { value: 50, label: '50 FCFA' },
  { value: 25, label: '25 FCFA' },
  { value: 10, label: '10 FCFA' },
  { value: 5, label: '5 FCFA' },
];

// ============================================================================
// Types
// ============================================================================

interface CashCountFormProps {
  registerName: string;
  theoreticalBalance: number; // centimes
  periodEntries: { label: string; amount: number }[];
  periodExits: { label: string; amount: number }[];
  openingBalance: number;
  onSubmit: (data: CashCountData) => void;
  onCancel: () => void;
}

export interface CashCountData {
  countedBalance: number;
  denomination: Record<number, number>;
  variance: number;
  justification: string;
  bankDeposit: number;
  bankAccountId: string;
  balanceCarried: number;
}

// ============================================================================
// Component
// ============================================================================

export function CashCountForm({
  registerName,
  theoreticalBalance,
  periodEntries,
  periodExits,
  openingBalance,
  onSubmit,
  onCancel,
}: CashCountFormProps) {
  const [billCounts, setBillCounts] = useState<Record<number, number>>(
    Object.fromEntries(BILLS.map(b => [b.value, 0]))
  );
  const [coinCounts, setCoinCounts] = useState<Record<number, number>>(
    Object.fromEntries(COINS.map(c => [c.value, 0]))
  );
  const [useSimpleMode, setUseSimpleMode] = useState(false);
  const [simpleTotal, setSimpleTotal] = useState(0);
  const [justification, setJustification] = useState('');
  const [bankDeposit, setBankDeposit] = useState(0);
  const [bankAccountId, setBankAccountId] = useState('');

  // Calculate totals
  const billsTotal = useMemo(() =>
    BILLS.reduce((s, b) => s + b.value * 100 * (billCounts[b.value] || 0), 0), [billCounts]
  );
  const coinsTotal = useMemo(() =>
    COINS.reduce((s, c) => s + c.value * 100 * (coinCounts[c.value] || 0), 0), [coinCounts]
  );
  const countedBalance = useSimpleMode ? simpleTotal * 100 : billsTotal + coinsTotal;
  const variance = countedBalance - theoreticalBalance;
  const absVariance = Math.abs(variance);
  const balanceCarried = countedBalance - bankDeposit * 100;

  // Variance severity
  const severity = absVariance === 0 ? 'perfect'
    : absVariance <= 100_000 ? 'minor'  // <= 1000 FCFA
    : absVariance <= 1_000_000 ? 'moderate' // <= 10 000 FCFA
    : 'critical'; // > 10 000 FCFA

  const totalEntries = periodEntries.reduce((s, e) => s + e.amount, 0);
  const totalExits = periodExits.reduce((s, e) => s + e.amount, 0);

  function formatFCFA(centimes: number) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(centimes / 100) + ' FCFA';
  }

  function handleSubmit() {
    const denomination = { ...billCounts, ...coinCounts };
    onSubmit({
      countedBalance,
      denomination,
      variance,
      justification,
      bankDeposit: bankDeposit * 100,
      bankAccountId,
      balanceCarried,
    });
  }

  return (
    <div className="space-y-4">
      {/* Section B — Theoretical balance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Solde theorique (calcule)</CardTitle>
          <CardDescription>{registerName} — Arrete du {new Date().toLocaleDateString('fr-FR')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Solde au dernier arrete</span>
            <span className="font-medium">{formatFCFA(openingBalance)}</span>
          </div>
          <Separator />

          {periodEntries.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Entrees</p>
              {periodEntries.map((e, i) => (
                <div key={i} className="flex justify-between text-green-600">
                  <span>{e.label}</span>
                  <span>+ {formatFCFA(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium">
                <span>Total entrees</span>
                <span className="text-green-600">+ {formatFCFA(totalEntries)}</span>
              </div>
              <Separator />
            </>
          )}

          {periodExits.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Sorties</p>
              {periodExits.map((e, i) => (
                <div key={i} className="flex justify-between text-red-600">
                  <span>{e.label}</span>
                  <span>- {formatFCFA(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium">
                <span>Total sorties</span>
                <span className="text-red-600">- {formatFCFA(totalExits)}</span>
              </div>
              <Separator />
            </>
          )}

          <div className="flex justify-between text-base font-bold">
            <span>SOLDE THEORIQUE</span>
            <span>{formatFCFA(theoreticalBalance)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Section C — Physical count */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Comptage physique</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setUseSimpleMode(!useSimpleMode)}
            >
              {useSimpleMode ? 'Mode detaille' : 'Mode simplifie'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {useSimpleMode ? (
            <div className="space-y-2">
              <Label>Montant total compte (FCFA)</Label>
              <Input
                type="number"
                value={simpleTotal || ''}
                onChange={(e) => setSimpleTotal(Number(e.target.value))}
                placeholder="Ex: 1572000"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Bills */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  <Banknote className="h-3.5 w-3.5" />
                  Billets
                </div>
                {BILLS.map((b) => (
                  <div key={`bill-${b.value}`} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">{b.label}</span>
                    <span className="text-xs text-muted-foreground">x</span>
                    <Input
                      type="number"
                      min={0}
                      value={billCounts[b.value] || ''}
                      onChange={(e) => setBillCounts(prev => ({ ...prev, [b.value]: Number(e.target.value) || 0 }))}
                      className="w-16 h-7 text-xs text-center"
                    />
                    <span className="text-xs text-right w-20 tabular-nums">
                      = {formatFCFA(b.value * 100 * (billCounts[b.value] || 0))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium pt-1 border-t">
                  <span>Sous-total billets</span>
                  <span>{formatFCFA(billsTotal)}</span>
                </div>
              </div>

              {/* Coins */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  <Coins className="h-3.5 w-3.5" />
                  Pieces
                </div>
                {COINS.map((c) => (
                  <div key={`coin-${c.value}`} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">{c.label}</span>
                    <span className="text-xs text-muted-foreground">x</span>
                    <Input
                      type="number"
                      min={0}
                      value={coinCounts[c.value] || ''}
                      onChange={(e) => setCoinCounts(prev => ({ ...prev, [c.value]: Number(e.target.value) || 0 }))}
                      className="w-16 h-7 text-xs text-center"
                    />
                    <span className="text-xs text-right w-20 tabular-nums">
                      = {formatFCFA(c.value * 100 * (coinCounts[c.value] || 0))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium pt-1 border-t">
                  <span>Sous-total pieces</span>
                  <span>{formatFCFA(coinsTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Total counted */}
          <div className="flex justify-between text-base font-bold mt-4 pt-3 border-t-2">
            <span>TOTAL COMPTE PHYSIQUEMENT</span>
            <span>{formatFCFA(countedBalance)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Section D — Reconciliation */}
      <Card className={cn(
        severity === 'perfect' && 'border-green-200 bg-green-50/30',
        severity === 'minor' && 'border-blue-200',
        severity === 'moderate' && 'border-orange-200 bg-orange-50/30',
        severity === 'critical' && 'border-red-300 bg-red-50/30',
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            Reconciliation
            {severity === 'perfect' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {severity === 'minor' && <CheckCircle className="h-4 w-4 text-blue-600" />}
            {severity === 'moderate' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            {severity === 'critical' && <XCircle className="h-4 w-4 text-red-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Theorique</span>
              <p className="font-medium">{formatFCFA(theoreticalBalance)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Compte</span>
              <p className="font-medium">{formatFCFA(countedBalance)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Ecart</span>
              <p className={cn('font-bold', variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : '')}>
                {variance >= 0 ? '+' : ''}{formatFCFA(variance)}
              </p>
            </div>
          </div>

          <Badge variant={severity === 'perfect' || severity === 'minor' ? 'success' : severity === 'moderate' ? 'warning' : 'destructive'}>
            {severity === 'perfect' && 'Parfait — aucun ecart'}
            {severity === 'minor' && 'Note — ecart mineur (justification libre)'}
            {severity === 'moderate' && 'Justification obligatoire sous 24h'}
            {severity === 'critical' && 'BLOCAGE CAISSE — Alerte DAF/DGA immediate'}
          </Badge>

          {(severity === 'moderate' || severity === 'critical') && (
            <div className="space-y-1">
              <Label className="text-xs">Justification de l'ecart *</Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Expliquez l'ecart constate..."
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section E — Bank deposit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Reversement en banque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Montant a reverser (FCFA)</Label>
              <Input
                type="number"
                min={0}
                value={bankDeposit || ''}
                onChange={(e) => setBankDeposit(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Compte bancaire</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sgbci">SGBCI Operationnel</SelectItem>
                  <SelectItem value="bicici">BICICI Loyers</SelectItem>
                  <SelectItem value="ecobank">ECOBANK CAPEX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between text-sm font-medium pt-2 border-t">
            <span>Solde conserve en caisse</span>
            <span>{formatFCFA(balanceCarried)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Section F — Summary */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recapitulatif final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Solde d'ouverture</span><span>{formatFCFA(openingBalance)}</span></div>
          <div className="flex justify-between text-green-600"><span>Total entrees</span><span>+ {formatFCFA(totalEntries)}</span></div>
          <div className="flex justify-between text-red-600"><span>Total sorties</span><span>- {formatFCFA(totalExits)}</span></div>
          <div className="flex justify-between"><span>Solde theorique</span><span>{formatFCFA(theoreticalBalance)}</span></div>
          <div className="flex justify-between font-medium"><span>Solde compte</span><span>{formatFCFA(countedBalance)}</span></div>
          <div className={cn('flex justify-between font-bold', variance !== 0 && (variance > 0 ? 'text-green-600' : 'text-red-600'))}>
            <span>Ecart</span><span>{variance >= 0 ? '+' : ''}{formatFCFA(variance)}</span>
          </div>
          {bankDeposit > 0 && (
            <div className="flex justify-between"><span>Reversement banque</span><span>- {formatFCFA(bankDeposit * 100)}</span></div>
          )}
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Solde conserve en caisse</span><span>{formatFCFA(balanceCarried)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button variant="outline" onClick={handleSubmit}>Enregistrer brouillon</Button>
        <Button
          onClick={handleSubmit}
          disabled={severity === 'critical' && !justification}
        >
          Cloturer l'arrete
        </Button>
      </div>
    </div>
  );
}

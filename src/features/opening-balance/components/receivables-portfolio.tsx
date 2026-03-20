import { useState } from 'react';
import { Plus, Trash2, Upload, AlertTriangle, ChevronDown, ChevronUp, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';
import type { PriorReceivable } from '../types';

const NATURE_LABELS: Record<PriorReceivable['nature'], string> = {
  rent: 'Loyer',
  charges: 'Charges',
  deposit: 'Dépôt / Caution',
  regularization: 'Régularisation',
  variable_rent: 'Loyer variable',
  other: 'Autre',
};

const STATUS_LABELS: Record<PriorReceivable['status'], string> = {
  normal: 'Normal',
  late: 'En retard',
  disputed: 'Contestée',
  litigation: 'Contentieux',
  irrecoverable: 'Irrécouvrable',
};

const STATUS_COLORS: Record<PriorReceivable['status'], string> = {
  normal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  disputed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  litigation: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  irrecoverable: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-300',
};

interface ReceivablesPortfolioProps {
  receivables: PriorReceivable[];
  onChange: (receivables: PriorReceivable[]) => void;
}

function computePrescriptionDate(dueDate: string): string {
  if (!dueDate) return '';
  const d = new Date(dueDate);
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().split('T')[0];
}

function computeAmountTTC(amountHT: number, vatRate: number): number {
  return Math.round(amountHT * (1 + vatRate / 100));
}

function createEmptyReceivable(): PriorReceivable {
  const now = new Date().toISOString().split('T')[0];
  return {
    id: `recv-${Date.now()}`,
    debtor_name: '',
    nature: 'rent',
    periods: [],
    amount_ht: 0,
    vat_rate: 18,
    amount_ttc: 0,
    partial_payments: 0,
    balance_ttc: 0,
    late_interest: 0,
    late_interest_rate: 10,
    recoverable_amount: 0,
    probability_pct: 100,
    status: 'normal',
    original_due_date: now,
    expected_date: now,
    has_installment_plan: false,
    prescription_date: computePrescriptionDate(now),
    notes: '',
  };
}

export function ReceivablesPortfolio({ receivables, onChange }: ReceivablesPortfolioProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Summaries
  const totalGrossTTC = receivables.reduce((s, r) => s + r.amount_ttc, 0);
  const totalBalanceTTC = receivables.reduce((s, r) => s + r.balance_ttc, 0);
  const irrecoverableTotal = receivables
    .filter((r) => r.status === 'irrecoverable')
    .reduce((s, r) => s + r.balance_ttc, 0);
  const litigationTotal = receivables
    .filter((r) => r.status === 'litigation')
    .reduce((s, r) => s + r.balance_ttc, 0);
  const baseScenarioWeighted = receivables
    .filter((r) => r.status !== 'irrecoverable')
    .reduce((s, r) => s + r.recoverable_amount * (r.probability_pct / 100), 0);
  const optimisticOnly = receivables
    .filter((r) => r.status !== 'irrecoverable')
    .reduce((s, r) => s + r.recoverable_amount, 0);
  const totalLateInterest = receivables.reduce((s, r) => s + r.late_interest, 0);

  const byStatus = {
    normal: receivables.filter((r) => r.status === 'normal').length,
    late: receivables.filter((r) => r.status === 'late').length,
    disputed: receivables.filter((r) => r.status === 'disputed').length,
    litigation: receivables.filter((r) => r.status === 'litigation').length,
    irrecoverable: receivables.filter((r) => r.status === 'irrecoverable').length,
  };

  function addReceivable() {
    onChange([...receivables, createEmptyReceivable()]);
  }

  function removeReceivable(id: string) {
    onChange(receivables.filter((r) => r.id !== id));
  }

  function updateReceivable(id: string, updates: Partial<PriorReceivable>) {
    onChange(
      receivables.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        // Recompute derived fields
        updated.amount_ttc = computeAmountTTC(updated.amount_ht, updated.vat_rate);
        updated.balance_ttc = updated.amount_ttc - updated.partial_payments;
        updated.recoverable_amount = updated.balance_ttc + updated.late_interest;
        updated.prescription_date = computePrescriptionDate(updated.original_due_date);
        return updated;
      })
    );
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function addInstallment(id: string) {
    const r = receivables.find((x) => x.id === id);
    if (!r) return;
    const schedule = [...(r.installment_schedule ?? []), { date: '', amount: 0 }];
    updateReceivable(id, { installment_schedule: schedule });
  }

  function updateInstallment(id: string, idx: number, field: 'date' | 'amount', value: string | number) {
    const r = receivables.find((x) => x.id === id);
    if (!r || !r.installment_schedule) return;
    const schedule = r.installment_schedule.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    updateReceivable(id, { installment_schedule: schedule });
  }

  function removeInstallment(id: string, idx: number) {
    const r = receivables.find((x) => x.id === id);
    if (!r || !r.installment_schedule) return;
    const schedule = r.installment_schedule.filter((_, i) => i !== idx);
    updateReceivable(id, { installment_schedule: schedule });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Portefeuille des créances antérieures</h3>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total brut TTC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalGrossTTC, 'XOF')}</p>
            <p className="text-xs text-muted-foreground">Solde restant: {formatCurrency(totalBalanceTTC, 'XOF')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Scénario pondéré</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{formatCurrency(baseScenarioWeighted, 'XOF')}</p>
            <p className="text-xs text-muted-foreground">Optimiste: {formatCurrency(optimisticOnly, 'XOF')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Exclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Irrécouvrable: <span className="font-medium text-red-600">{formatCurrency(irrecoverableTotal, 'XOF')}</span></p>
            <p className="text-sm">Contentieux: <span className="font-medium text-orange-600">{formatCurrency(litigationTotal, 'XOF')}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Répartition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xs">Normal: {byStatus.normal} | Retard: {byStatus.late} | Contestée: {byStatus.disputed}</p>
            <p className="text-xs">Contentieux: {byStatus.litigation} | Irréc.: {byStatus.irrecoverable}</p>
            <p className="text-xs font-medium mt-1">Intérêts de retard: {formatCurrency(totalLateInterest, 'XOF')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]" />
              <TableHead className="min-w-[160px]">Débiteur</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Réf. facture</TableHead>
              <TableHead className="text-right">Montant HT</TableHead>
              <TableHead className="text-right">TVA %</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead className="text-right">Acomptes</TableHead>
              <TableHead className="text-right">Solde TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Prob. %</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivables.map((r) => (
              <>
                <TableRow
                  key={r.id}
                  className={cn(
                    r.status === 'irrecoverable' && 'opacity-60',
                    'cursor-pointer hover:bg-muted/50'
                  )}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpand(r.id)}
                    >
                      {expandedId === r.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.debtor_name}
                      onChange={(e) => updateReceivable(r.id, { debtor_name: e.target.value })}
                      className="h-8"
                      placeholder="Nom du débiteur"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.nature}
                      onValueChange={(v) => updateReceivable(r.id, { nature: v as PriorReceivable['nature'] })}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(NATURE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.invoice_ref ?? ''}
                      onChange={(e) => updateReceivable(r.id, { invoice_ref: e.target.value })}
                      className="h-8 w-[120px]"
                      placeholder="FAC-..."
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.amount_ht || ''}
                      onChange={(e) => updateReceivable(r.id, { amount_ht: Number(e.target.value) || 0 })}
                      className="h-8 w-[120px] text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.vat_rate}
                      onChange={(e) => updateReceivable(r.id, { vat_rate: Number(e.target.value) || 0 })}
                      className="h-8 w-[60px] text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(r.amount_ttc, 'XOF')}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.partial_payments || ''}
                      onChange={(e) => updateReceivable(r.id, { partial_payments: Number(e.target.value) || 0 })}
                      className="h-8 w-[110px] text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(r.balance_ttc, 'XOF')}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.status}
                      onValueChange={(v) => updateReceivable(r.id, { status: v as PriorReceivable['status'] })}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {r.status === 'irrecoverable' && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        Exclue des prévisions
                      </div>
                    )}
                    {r.status === 'litigation' && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-orange-600">
                        <Scale className="h-3 w-3" />
                        En contentieux
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={r.probability_pct}
                      onChange={(e) => updateReceivable(r.id, { probability_pct: Number(e.target.value) || 0 })}
                      className="h-8 w-[70px] text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeReceivable(r.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded detail row */}
                {expandedId === r.id && (
                  <TableRow key={`${r.id}-detail`}>
                    <TableCell colSpan={12} className="bg-muted/30 p-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* Column 1: Dates & Periods */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Dates et périodes</h4>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Périodes concernées</Label>
                              <Input
                                value={r.periods.join(', ')}
                                onChange={(e) => updateReceivable(r.id, {
                                  periods: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                })}
                                className="h-8"
                                placeholder="2025-11, 2025-12"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Date d'échéance originale</Label>
                              <Input
                                type="date"
                                value={r.original_due_date}
                                onChange={(e) => updateReceivable(r.id, { original_due_date: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Date de recouvrement prévue</Label>
                              <Input
                                type="date"
                                value={r.expected_date}
                                onChange={(e) => updateReceivable(r.id, { expected_date: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Date de prescription (OHADA 5 ans)</Label>
                              <Input
                                type="date"
                                value={r.prescription_date}
                                readOnly
                                className="h-8 bg-muted"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Interest & Financial */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Intérêts et montants</h4>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Taux intérêts de retard (%)</Label>
                              <Input
                                type="number"
                                value={r.late_interest_rate ?? ''}
                                onChange={(e) => updateReceivable(r.id, { late_interest_rate: Number(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Intérêts de retard (FCFA)</Label>
                              <Input
                                type="number"
                                value={r.late_interest || ''}
                                onChange={(e) => updateReceivable(r.id, { late_interest: Number(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Montant recouvrable total</Label>
                              <Input
                                type="number"
                                value={r.recoverable_amount}
                                readOnly
                                className="h-8 bg-muted font-medium"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Compte de réception</Label>
                              <Input
                                value={r.reception_account_id ?? ''}
                                onChange={(e) => updateReceivable(r.id, { reception_account_id: e.target.value })}
                                className="h-8"
                                placeholder="ID du compte"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Options & Notes */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Options et notes</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={r.linked_dispute ?? false}
                                onCheckedChange={(v) => updateReceivable(r.id, { linked_dispute: !!v })}
                              />
                              <Label className="text-xs">Litige lié</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={r.has_installment_plan}
                                onCheckedChange={(v) => updateReceivable(r.id, { has_installment_plan: !!v })}
                              />
                              <Label className="text-xs">Plan d'échéancement</Label>
                            </div>
                            <div>
                              <Label className="text-xs">Notes</Label>
                              <Textarea
                                value={r.notes ?? ''}
                                onChange={(e) => updateReceivable(r.id, { notes: e.target.value })}
                                className="min-h-[60px]"
                                placeholder="Commentaires..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Installment Schedule */}
                      {r.has_installment_plan && (
                        <div className="mt-4">
                          <Separator className="mb-3" />
                          <h4 className="text-sm font-semibold mb-2">Échéancier de paiement</h4>
                          <div className="space-y-2">
                            {(r.installment_schedule ?? []).map((inst, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <Input
                                  type="date"
                                  value={inst.date}
                                  onChange={(e) => updateInstallment(r.id, idx, 'date', e.target.value)}
                                  className="h-8 w-[160px]"
                                />
                                <Input
                                  type="number"
                                  value={inst.amount || ''}
                                  onChange={(e) => updateInstallment(r.id, idx, 'amount', Number(e.target.value) || 0)}
                                  className="h-8 w-[140px] text-right"
                                  placeholder="Montant FCFA"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeInstallment(r.id, idx)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addInstallment(r.id)}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Ajouter une échéance
                            </Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={addReceivable}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une créance
        </Button>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importer depuis Excel
        </Button>
      </div>

      {/* Bottom Summary */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Synthèse du portefeuille créances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total brut TTC:</span>
              <span className="font-medium">{formatCurrency(totalGrossTTC, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Solde restant TTC:</span>
              <span className="font-medium">{formatCurrency(totalBalanceTTC, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Irrécouvrable exclu:</span>
              <span className="font-medium text-red-600">-{formatCurrency(irrecoverableTotal, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contentieux exclu:</span>
              <span className="font-medium text-orange-600">-{formatCurrency(litigationTotal, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Scénario pondéré (base):</span>
              <span className="font-bold text-green-600">{formatCurrency(baseScenarioWeighted, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Intérêts de retard:</span>
              <span className="font-medium">{formatCurrency(totalLateInterest, 'XOF')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

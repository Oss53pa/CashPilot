import { useState } from 'react';
import { Plus, Trash2, Upload, Download, ChevronDown, ChevronUp, Clock } from 'lucide-react';
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
import { cn, formatCurrency } from '@/lib/utils';
import type { PriorPayable } from '../types';

const NATURE_LABELS: Record<PriorPayable['nature'], string> = {
  supplier_invoice: 'Facture fournisseur',
  salary: 'Salaires',
  capex: 'CAPEX / Investissement',
  tax: 'Impôts et taxes',
  tenant_refund: 'Remboursement locataire',
  deposit_return: 'Restitution caution',
  loan_repayment: 'Remboursement emprunt',
  interest: 'Intérêts',
  other: 'Autre',
};

const PRIORITY_LABELS: Record<PriorPayable['priority'], string> = {
  urgent: 'Urgent',
  normal: 'Normal',
  deferrable: 'Différable',
};

const PRIORITY_COLORS: Record<PriorPayable['priority'], string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  deferrable: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

interface PayablesPortfolioProps {
  payables: PriorPayable[];
  onChange: (payables: PriorPayable[]) => void;
}

function computeDelay(dueDate: string): number {
  if (!dueDate) return 0;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function computeAmountTTC(amountHT: number, vatDeductible?: number): number {
  return Math.round(amountHT + (vatDeductible ?? 0));
}

function createEmptyPayable(): PriorPayable {
  const now = new Date().toISOString().split('T')[0];
  return {
    id: `pay-${Date.now()}`,
    creditor_name: '',
    nature: 'supplier_invoice',
    amount_ht: 0,
    amount_ttc: 0,
    payments_made: 0,
    balance_remaining: 0,
    has_retention: false,
    original_due_date: now,
    current_delay: 0,
    late_penalties: 0,
    planned_payment_date: now,
    priority: 'normal',
    disbursement_account_id: '',
    notes: '',
  };
}

export function PayablesPortfolio({ payables, onChange }: PayablesPortfolioProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Summaries
  const totalTTC = payables.reduce((s, p) => s + p.amount_ttc, 0);
  const totalRemaining = payables.reduce((s, p) => s + p.balance_remaining, 0);
  const totalPenalties = payables.reduce((s, p) => s + p.late_penalties, 0);
  const totalRetention = payables
    .filter((p) => p.has_retention)
    .reduce((s, p) => s + (p.retention_amount ?? 0), 0);

  const byPriority = {
    urgent: payables.filter((p) => p.priority === 'urgent'),
    normal: payables.filter((p) => p.priority === 'normal'),
    deferrable: payables.filter((p) => p.priority === 'deferrable'),
  };

  const urgentTotal = byPriority.urgent.reduce((s, p) => s + p.balance_remaining, 0);
  const deferrableTotal = byPriority.deferrable.reduce((s, p) => s + p.balance_remaining, 0);

  const byNature = Object.entries(NATURE_LABELS).map(([key, label]) => ({
    key,
    label,
    count: payables.filter((p) => p.nature === key).length,
    total: payables
      .filter((p) => p.nature === key)
      .reduce((s, p) => s + p.balance_remaining, 0),
  })).filter((n) => n.count > 0);

  function addPayable() {
    onChange([...payables, createEmptyPayable()]);
  }

  function removePayable(id: string) {
    onChange(payables.filter((p) => p.id !== id));
  }

  function updatePayable(id: string, updates: Partial<PriorPayable>) {
    onChange(
      payables.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        // Recompute derived fields
        updated.amount_ttc = computeAmountTTC(updated.amount_ht, updated.vat_deductible);
        updated.balance_remaining = updated.amount_ttc - updated.payments_made;
        updated.current_delay = computeDelay(updated.original_due_date);
        return updated;
      })
    );
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Portefeuille des dettes anterieures</h3>
        <Button variant="outline" size="sm" onClick={() => {
          import('@/lib/import-templates').then(m => m.downloadPayablesTemplate());
        }}>
          <Download className="h-4 w-4 mr-2" />
          Template Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total dettes TTC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalTTC, 'XOF')}</p>
            <p className="text-xs text-muted-foreground">Solde restant: {formatCurrency(totalRemaining, 'XOF')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Par priorité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xs">
              <span className="text-red-600 font-medium">Urgent:</span> {byPriority.urgent.length} - {formatCurrency(urgentTotal, 'XOF')}
            </p>
            <p className="text-xs">Normal: {byPriority.normal.length}</p>
            <p className="text-xs">Différable: {byPriority.deferrable.length} - {formatCurrency(deferrableTotal, 'XOF')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Par nature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {byNature.slice(0, 4).map((n) => (
              <p key={n.key} className="text-xs">{n.label}: {formatCurrency(n.total, 'XOF')}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pénalités & retenues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Pénalités: <span className="font-medium">{formatCurrency(totalPenalties, 'XOF')}</span></p>
            <p className="text-sm">Retenues: <span className="font-medium">{formatCurrency(totalRetention, 'XOF')}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]" />
              <TableHead className="min-w-[160px]">Créancier</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Réf. facture</TableHead>
              <TableHead className="text-right">Montant HT</TableHead>
              <TableHead className="text-right">TVA déd.</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead className="text-right">Versements</TableHead>
              <TableHead className="text-right">Solde</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payables.map((p) => (
              <>
                <TableRow
                  key={p.id}
                  className={cn(
                    p.current_delay > 0 && 'bg-red-50/50 dark:bg-red-950/20',
                    'cursor-pointer hover:bg-muted/50'
                  )}
                >
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpand(p.id)}
                    >
                      {expandedId === p.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={p.creditor_name}
                      onChange={(e) => updatePayable(p.id, { creditor_name: e.target.value })}
                      className="h-8"
                      placeholder="Nom du créancier"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={p.nature}
                      onValueChange={(v) => updatePayable(p.id, { nature: v as PriorPayable['nature'] })}
                    >
                      <SelectTrigger className="h-8 w-[150px]">
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
                      value={p.invoice_ref ?? ''}
                      onChange={(e) => updatePayable(p.id, { invoice_ref: e.target.value })}
                      className="h-8 w-[120px]"
                      placeholder="Réf..."
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={p.amount_ht || ''}
                      onChange={(e) => updatePayable(p.id, { amount_ht: Number(e.target.value) || 0 })}
                      className="h-8 w-[120px] text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={p.vat_deductible ?? ''}
                      onChange={(e) => updatePayable(p.id, { vat_deductible: Number(e.target.value) || 0 })}
                      className="h-8 w-[100px] text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(p.amount_ttc, 'XOF')}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={p.payments_made || ''}
                      onChange={(e) => updatePayable(p.id, { payments_made: Number(e.target.value) || 0 })}
                      className="h-8 w-[110px] text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {formatCurrency(p.balance_remaining, 'XOF')}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={p.priority}
                      onValueChange={(v) => updatePayable(p.id, { priority: v as PriorPayable['priority'] })}
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {p.current_delay > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <Clock className="h-3 w-3" />
                        {p.current_delay}j de retard
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={p.planned_payment_date}
                      onChange={(e) => updatePayable(p.id, { planned_payment_date: e.target.value })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removePayable(p.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded detail row */}
                {expandedId === p.id && (
                  <TableRow key={`${p.id}-detail`}>
                    <TableCell colSpan={12} className="bg-muted/30 p-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* Column 1: Dates */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Dates</h4>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Date d'échéance originale</Label>
                              <Input
                                type="date"
                                value={p.original_due_date}
                                onChange={(e) => updatePayable(p.id, { original_due_date: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Retard actuel (jours)</Label>
                              <Input
                                type="number"
                                value={p.current_delay}
                                readOnly
                                className="h-8 bg-muted"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Pénalités de retard (FCFA)</Label>
                              <Input
                                type="number"
                                value={p.late_penalties || ''}
                                onChange={(e) => updatePayable(p.id, { late_penalties: Number(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Retention & Account */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Retenue et compte</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={p.has_retention}
                                onCheckedChange={(v) => updatePayable(p.id, { has_retention: !!v })}
                              />
                              <Label className="text-xs">Retenue de garantie</Label>
                            </div>
                            {p.has_retention && (
                              <div>
                                <Label className="text-xs">Montant retenue (FCFA)</Label>
                                <Input
                                  type="number"
                                  value={p.retention_amount ?? ''}
                                  onChange={(e) => updatePayable(p.id, { retention_amount: Number(e.target.value) || 0 })}
                                  className="h-8"
                                />
                              </div>
                            )}
                            <div>
                              <Label className="text-xs">Compte de décaissement</Label>
                              <Input
                                value={p.disbursement_account_id}
                                onChange={(e) => updatePayable(p.id, { disbursement_account_id: e.target.value })}
                                className="h-8"
                                placeholder="ID du compte"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">ID Créancier</Label>
                              <Input
                                value={p.creditor_id ?? ''}
                                onChange={(e) => updatePayable(p.id, { creditor_id: e.target.value })}
                                className="h-8"
                                placeholder="Optionnel"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Notes */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Notes et pièces</h4>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Notes</Label>
                              <Textarea
                                value={p.notes ?? ''}
                                onChange={(e) => updatePayable(p.id, { notes: e.target.value })}
                                className="min-h-[60px]"
                                placeholder="Commentaires..."
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Pièces jointes: bon de commande et facture peuvent être téléchargés via le module Documents.
                            </p>
                          </div>
                        </div>
                      </div>
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
        <Button variant="outline" onClick={addPayable}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une dette
        </Button>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importer depuis Excel
        </Button>
      </div>

      {/* Bottom Summary */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Synthèse du portefeuille dettes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total brut TTC:</span>
              <span className="font-medium">{formatCurrency(totalTTC, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Solde restant:</span>
              <span className="font-bold text-red-600">{formatCurrency(totalRemaining, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Urgent à payer:</span>
              <span className="font-medium text-red-600">{formatCurrency(urgentTotal, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Différable:</span>
              <span className="font-medium">{formatCurrency(deferrableTotal, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pénalités totales:</span>
              <span className="font-medium">{formatCurrency(totalPenalties, 'XOF')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Retenues de garantie:</span>
              <span className="font-medium">{formatCurrency(totalRetention, 'XOF')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

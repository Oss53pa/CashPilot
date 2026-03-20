import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type {
  ReceivableEntry,
  ReceivableInstallment,
  ReceivablePayment,
} from '../types';
import {
  receivableNatures,
  receivableNatureLabels,
  receivableStatusLabels,
} from '../types';

// ── Helpers ──
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function generateReference(): string {
  const yr = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `CRE-${yr}-${seq}`;
}

function computeVAT(ht: number, rate: number, applicable: boolean): number {
  return applicable ? Math.round(ht * rate / 100) : 0;
}

function computeAgingDays(dueDate: string): number {
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function computeAgingBracket(days: number): ReceivableEntry['aging_bracket'] {
  if (days < 30) return '<30';
  if (days < 60) return '30-60';
  if (days < 90) return '60-90';
  return '>90';
}

function computePrescriptionDate(dueDate: string): string {
  const d = new Date(dueDate);
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().split('T')[0];
}

function computePrescriptionAlert(prescriptionDate: string): boolean {
  const diff = new Date(prescriptionDate).getTime() - Date.now();
  return diff < 6 * 30 * 86_400_000 && diff > 0;
}

function computeLateInterest(balance: number, rate: number, days: number): number {
  if (days <= 0 || rate <= 0) return 0;
  return Math.round(balance * (rate / 100) * (days / 365));
}

function fmtFCFA(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(v) + ' FCFA';
}

function fmtDate(d: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR');
}

// ── Types ──
interface ReceivableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<ReceivableEntry>) => void;
  entry?: ReceivableEntry | null;
  isLoading?: boolean;
}

type Tab = 'identification' | 'montants' | 'temporalite' | 'echelonnement' | 'statut' | 'rapprochement' | 'pieces' | 'historique';

// ── Component ──
export function ReceivableForm({ open, onOpenChange, onSave, entry, isLoading }: ReceivableFormProps) {
  const isEdit = !!entry?.id;

  // ── State ──
  const [tab, setTab] = useState<Tab>('identification');
  const [reference] = useState(() => entry?.reference || generateReference());
  const [debtorName, setDebtorName] = useState(entry?.debtor_name ?? '');
  const [nature, setNature] = useState<ReceivableEntry['nature']>(entry?.nature ?? 'fixed_rent');
  const [contractRef, setContractRef] = useState(entry?.contract_ref ?? '');
  const [recurrence, setRecurrence] = useState<ReceivableEntry['recurrence']>(entry?.recurrence ?? 'one_time');
  const [origin, setOrigin] = useState<ReceivableEntry['origin']>(entry?.origin ?? 'manual');

  // Amounts
  const [amountHT, setAmountHT] = useState(entry?.amount_ht ?? 0);
  const [vatApplicable, setVatApplicable] = useState(entry?.vat_applicable ?? true);
  const [vatRate, setVatRate] = useState(entry?.vat_rate ?? 18);
  const [partialPayments, setPartialPayments] = useState(entry?.partial_payments_received ?? 0);
  const [lateInterestRate, setLateInterestRate] = useState(entry?.late_interest_rate ?? 12);
  const [recoverableAmount, setRecoverableAmount] = useState(entry?.recoverable_amount ?? 0);
  const [probabilityPct, setProbabilityPct] = useState(entry?.probability_pct ?? 100);
  const [discountReason, setDiscountReason] = useState(entry?.discount_reason ?? '');

  // Temporality
  const [periods, setPeriods] = useState<string[]>(entry?.periods ?? []);
  const [invoiceRef, setInvoiceRef] = useState(entry?.invoice_ref ?? '');
  const [invoiceDate, setInvoiceDate] = useState(entry?.invoice_date ?? new Date().toISOString().split('T')[0]);
  const [originalDueDate, setOriginalDueDate] = useState(entry?.original_due_date ?? new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(entry?.expected_date ?? new Date().toISOString().split('T')[0]);
  const [receptionAccountId, setReceptionAccountId] = useState(entry?.reception_account_id ?? '');

  // Installment
  const [hasInstallmentPlan, setHasInstallmentPlan] = useState(entry?.has_installment_plan ?? false);
  const [planDate, setPlanDate] = useState(entry?.plan_date ?? '');
  const [planContext, setPlanContext] = useState(entry?.plan_context ?? '');
  const [planExpiry, setPlanExpiry] = useState(entry?.plan_expiry ?? '');
  const [planDocument, setPlanDocument] = useState(entry?.plan_document ?? '');
  const [installments, setInstallments] = useState<ReceivableInstallment[]>(entry?.installments ?? []);

  // Status
  const [status, setStatus] = useState<ReceivableEntry['status']>(entry?.status ?? 'normal');
  const [statusReason, setStatusReason] = useState(entry?.status_reason ?? '');
  const [priority, setPriority] = useState<ReceivableEntry['priority']>(entry?.priority ?? 'normal');
  const [nextAction, setNextAction] = useState<ReceivableEntry['next_action']>(entry?.next_action ?? 'none');
  const [nextActionDate, setNextActionDate] = useState(entry?.next_action_date ?? '');
  const [reminderTemplate, setReminderTemplate] = useState<ReceivableEntry['reminder_template']>(entry?.reminder_template);
  const [linkedDispute, setLinkedDispute] = useState(entry?.linked_dispute ?? false);

  // Files
  const [invoiceFile, setInvoiceFile] = useState(entry?.invoice_file ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');

  // Payment recording
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Virement bancaire');
  const [payAccount, setPayAccount] = useState('');
  const [payments, setPayments] = useState<ReceivablePayment[]>(entry?.payments ?? []);

  // ── Computed values ──
  const amountVAT = useMemo(() => computeVAT(amountHT, vatRate, vatApplicable), [amountHT, vatRate, vatApplicable]);
  const amountTTC = useMemo(() => amountHT + amountVAT, [amountHT, amountVAT]);
  const balanceTTC = useMemo(() => Math.max(0, amountTTC - partialPayments), [amountTTC, partialPayments]);
  const agingDays = useMemo(() => computeAgingDays(originalDueDate), [originalDueDate]);
  const agingBracket = useMemo(() => computeAgingBracket(agingDays), [agingDays]);
  const lateInterestComputed = useMemo(() => computeLateInterest(balanceTTC, lateInterestRate, agingDays), [balanceTTC, lateInterestRate, agingDays]);
  const prescriptionDate = useMemo(() => computePrescriptionDate(originalDueDate), [originalDueDate]);
  const prescriptionAlert = useMemo(() => computePrescriptionAlert(prescriptionDate), [prescriptionDate]);
  const discount = useMemo(() => Math.max(0, balanceTTC - recoverableAmount), [balanceTTC, recoverableAmount]);
  const totalDue = useMemo(() => balanceTTC + lateInterestComputed, [balanceTTC, lateInterestComputed]);

  // Forecast impact
  const forecastBase = useMemo(() => Math.round(recoverableAmount * probabilityPct / 100), [recoverableAmount, probabilityPct]);
  const forecastOptimistic = useMemo(() => Math.round(balanceTTC + lateInterestComputed), [balanceTTC, lateInterestComputed]);
  const forecastPessimistic = useMemo(() => Math.round(forecastBase * 0.5), [forecastBase]);

  // Sync recoverable when balance changes
  useEffect(() => {
    if (!entry) setRecoverableAmount(balanceTTC);
  }, [balanceTTC, entry]);

  // ── Period toggle ──
  const togglePeriod = useCallback((period: string) => {
    setPeriods(prev => prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]);
  }, []);

  // ── Add installment row ──
  const addInstallment = useCallback(() => {
    setInstallments(prev => [...prev, { date: '', amount: 0, status: 'expected' }]);
  }, []);

  const updateInstallment = useCallback((idx: number, field: keyof ReceivableInstallment, value: string | number) => {
    setInstallments(prev => prev.map((inst, i) => i === idx ? { ...inst, [field]: value } : inst));
  }, []);

  const removeInstallment = useCallback((idx: number) => {
    setInstallments(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Record payment ──
  const recordPayment = useCallback(() => {
    if (payAmount <= 0) return;
    const newBal = Math.max(0, balanceTTC - payAmount);
    const payment: ReceivablePayment = {
      date: payDate,
      amount: payAmount,
      method: payMethod,
      account: payAccount || 'Compte principal',
      balance_after: newBal,
      recorded_by: 'Utilisateur courant',
    };
    setPayments(prev => [...prev, payment]);
    setPartialPayments(prev => prev + payAmount);
    setShowPaymentForm(false);
    setPayAmount(0);
  }, [payDate, payAmount, payMethod, payAccount, balanceTTC]);

  // ── Build & save ──
  const handleSave = useCallback(() => {
    const data: Partial<ReceivableEntry> = {
      ...(entry?.id ? { id: entry.id } : {}),
      reference,
      debtor_name: debtorName,
      nature,
      contract_ref: contractRef || undefined,
      recurrence,
      origin,
      amount_ht: amountHT,
      vat_applicable: vatApplicable,
      vat_rate: vatRate,
      amount_vat: amountVAT,
      amount_ttc: amountTTC,
      partial_payments_received: partialPayments,
      balance_ttc: balanceTTC,
      late_interest: lateInterestComputed,
      late_interest_rate: lateInterestRate,
      late_interest_computed: lateInterestComputed,
      recoverable_amount: recoverableAmount,
      probability_pct: probabilityPct,
      discount,
      discount_reason: discountReason || undefined,
      periods,
      invoice_ref: invoiceRef || undefined,
      invoice_date: invoiceDate,
      original_due_date: originalDueDate,
      aging_days: agingDays,
      aging_bracket: agingBracket,
      expected_date: expectedDate,
      reception_account_id: receptionAccountId || undefined,
      prescription_date: prescriptionDate,
      prescription_alert: prescriptionAlert,
      has_installment_plan: hasInstallmentPlan,
      plan_date: planDate || undefined,
      plan_context: planContext || undefined,
      plan_expiry: planExpiry || undefined,
      plan_document: planDocument || undefined,
      installments: hasInstallmentPlan ? installments : undefined,
      status,
      status_reason: statusReason || undefined,
      priority,
      next_action: nextAction,
      next_action_date: nextActionDate || undefined,
      reminder_template: reminderTemplate,
      linked_dispute: linkedDispute,
      invoice_file: invoiceFile || undefined,
      notes: notes || undefined,
      payments,
    };
    onSave(data);
  }, [
    entry, reference, debtorName, nature, contractRef, recurrence, origin,
    amountHT, vatApplicable, vatRate, amountVAT, amountTTC, partialPayments,
    balanceTTC, lateInterestComputed, lateInterestRate, recoverableAmount,
    probabilityPct, discount, discountReason, periods, invoiceRef, invoiceDate,
    originalDueDate, agingDays, agingBracket, expectedDate, receptionAccountId,
    prescriptionDate, prescriptionAlert, hasInstallmentPlan, planDate, planContext,
    planExpiry, planDocument, installments, status, statusReason, priority,
    nextAction, nextActionDate, reminderTemplate, linkedDispute, invoiceFile, notes,
    payments, onSave,
  ]);

  // ── Aging badge variant ──
  function agingBadgeVariant(bracket: string) {
    if (bracket === '<30') return 'secondary' as const;
    if (bracket === '30-60') return 'warning' as const;
    return 'destructive' as const;
  }

  function statusBadgeVariant(s: ReceivableEntry['status']) {
    switch (s) {
      case 'normal': return 'success' as const;
      case 'late': return 'warning' as const;
      case 'disputed': return 'destructive' as const;
      case 'litigation': return 'destructive' as const;
      case 'irrecoverable': return 'destructive' as const;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">
            {isEdit ? 'Modifier' : 'Nouvelle'} Créance — {reference}
          </DialogTitle>
          <DialogDescription>Formulaire 5 — Contrepartie Créance</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(95vh-180px)]">
          <div className="px-6 pb-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList className="grid grid-cols-8 w-full mb-4">
                <TabsTrigger value="identification">A. Ident.</TabsTrigger>
                <TabsTrigger value="montants">B. Montants</TabsTrigger>
                <TabsTrigger value="temporalite">C. Temp.</TabsTrigger>
                <TabsTrigger value="echelonnement">D. Échel.</TabsTrigger>
                <TabsTrigger value="statut">E. Statut</TabsTrigger>
                <TabsTrigger value="rapprochement">F. Rappr.</TabsTrigger>
                <TabsTrigger value="pieces">G. Pièces</TabsTrigger>
                <TabsTrigger value="historique">H. Hist.</TabsTrigger>
              </TabsList>

              {/* ── Section A: Identification ── */}
              <TabsContent value="identification" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Identification de la créance</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Référence</Label>
                        <Input value={reference} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Société</Label>
                        <Input value="Société courante" disabled className="bg-muted" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nom du débiteur *</Label>
                      <Input
                        value={debtorName}
                        onChange={(e) => setDebtorName(e.target.value)}
                        placeholder="Saisir le nom du débiteur..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nature *</Label>
                        <Select value={nature} onValueChange={(v) => setNature(v as ReceivableEntry['nature'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {receivableNatures.map((n) => (
                              <SelectItem key={n} value={n}>{receivableNatureLabels[n]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Réf. contrat</Label>
                        <Input value={contractRef} onChange={(e) => setContractRef(e.target.value)} placeholder="BAIL-2026-XXXX" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Récurrence</Label>
                        <Select value={recurrence} onValueChange={(v) => setRecurrence(v as ReceivableEntry['recurrence'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one_time">Ponctuelle</SelectItem>
                            <SelectItem value="monthly_recurring">Récurrente mensuelle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Origine</Label>
                        <Select value={origin} onValueChange={(v) => setOrigin(v as ReceivableEntry['origin'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Saisie manuelle</SelectItem>
                            <SelectItem value="auto_from_lease">Automatique (bail)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section B: Montants ── */}
              <TabsContent value="montants" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Montants et calculs</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Montant HT (FCFA) *</Label>
                        <Input type="number" value={amountHT} onChange={(e) => setAmountHT(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>TVA applicable</Label>
                          <Switch checked={vatApplicable} onCheckedChange={setVatApplicable} />
                        </div>
                        {vatApplicable && (
                          <div className="flex items-center gap-2 mt-2">
                            <Label className="text-xs">Taux</Label>
                            <Input type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className="w-20" />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Montant TVA</Label>
                        <Input value={fmtFCFA(amountVAT)} disabled className="bg-muted" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="font-semibold">Montant TTC</Label>
                        <div className="text-lg font-bold text-primary">{fmtFCFA(amountTTC)}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Acomptes reçus</Label>
                        <Input type="number" value={partialPayments} onChange={(e) => setPartialPayments(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">Solde TTC</Label>
                        <div className="text-lg font-bold text-orange-600">{fmtFCFA(balanceTTC)}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Taux intérêts de retard (%)</Label>
                        <Input type="number" value={lateInterestRate} onChange={(e) => setLateInterestRate(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Intérêts de retard (calculé)</Label>
                        <div className="text-sm font-medium text-red-600">{fmtFCFA(lateInterestComputed)}</div>
                        <span className="text-xs text-muted-foreground">{agingDays} jours de retard</span>
                      </div>
                      <div className="space-y-2">
                        <Label>Montant recouvrable</Label>
                        <Input type="number" value={recoverableAmount} onChange={(e) => setRecoverableAmount(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Probabilité d'encaissement</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={probabilityPct}
                            onChange={(e) => setProbabilityPct(Number(e.target.value))}
                            className="flex-1"
                          />
                          <Badge variant={probabilityPct >= 80 ? 'success' : probabilityPct >= 50 ? 'warning' : 'destructive'}>
                            {probabilityPct}%
                          </Badge>
                        </div>
                        <Progress value={probabilityPct} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <Label>Décote (calculée)</Label>
                        <div className="text-sm font-medium">{fmtFCFA(discount)}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Motif de la décote</Label>
                        <Input value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="Ex: Provision créance douteuse" />
                      </div>
                    </div>

                    {/* Forecast impact */}
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Impact prévisionnel sur la trésorerie</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-3 text-center">
                            <div className="text-xs text-muted-foreground">Optimiste</div>
                            <div className="font-bold text-green-700">{fmtFCFA(forecastOptimistic)}</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-3 text-center">
                            <div className="text-xs text-muted-foreground">Base</div>
                            <div className="font-bold text-blue-700">{fmtFCFA(forecastBase)}</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-200">
                          <CardContent className="p-3 text-center">
                            <div className="text-xs text-muted-foreground">Pessimiste</div>
                            <div className="font-bold text-red-700">{fmtFCFA(forecastPessimistic)}</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section C: Temporalité ── */}
              <TabsContent value="temporalite" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Temporalité</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Périodes concernées</Label>
                      <div className="flex flex-wrap gap-2">
                        {MONTHS_FR.map((m, idx) => {
                          const val = `2026-${String(idx + 1).padStart(2, '0')}`;
                          const selected = periods.includes(val);
                          return (
                            <Badge
                              key={val}
                              variant={selected ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => togglePeriod(val)}
                            >
                              {m}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Réf. facture</Label>
                        <Input value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="FAC-2026-XXXX" />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de facture</Label>
                        <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date d'échéance initiale</Label>
                        <Input type="date" value={originalDueDate} onChange={(e) => setOriginalDueDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Ancienneté (jours)</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{agingDays}</span>
                          <Badge variant={agingBadgeVariant(agingBracket)}>{agingBracket} jours</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Date de réception attendue</Label>
                        <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Compte de réception</Label>
                        <Select value={receptionAccountId} onValueChange={setReceptionAccountId}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner un compte" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acc-001">SGBCI - Compte courant</SelectItem>
                            <SelectItem value="acc-002">BIAO-CI - Compte courant</SelectItem>
                            <SelectItem value="acc-003">Ecobank - Compte épargne</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date de prescription (OHADA 5 ans)</Label>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{fmtDate(prescriptionDate)}</span>
                          {prescriptionAlert && (
                            <Badge variant="destructive">Attention: &lt; 6 mois</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section D: Accord échelonné ── */}
              <TabsContent value="echelonnement" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Accord d'échelonnement</CardTitle>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Activer</Label>
                        <Switch checked={hasInstallmentPlan} onCheckedChange={setHasInstallmentPlan} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!hasInstallmentPlan ? (
                      <p className="text-sm text-muted-foreground">Aucun plan d'échelonnement actif. Activez le toggle pour configurer.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date de l'accord</Label>
                            <Input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Date d'expiration</Label>
                            <Input type="date" value={planExpiry} onChange={(e) => setPlanExpiry(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Contexte</Label>
                          <Textarea value={planContext} onChange={(e) => setPlanContext(e.target.value)} placeholder="Circonstances de l'accord..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Document justificatif</Label>
                          <Input value={planDocument} onChange={(e) => setPlanDocument(e.target.value)} placeholder="Nom du fichier..." />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Échéancier</Label>
                          <Button variant="outline" size="sm" onClick={addInstallment}>Ajouter une échéance</Button>
                        </div>

                        {installments.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Reçu</TableHead>
                                <TableHead>Date réception</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {installments.map((inst, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Input type="date" value={inst.date} onChange={(e) => updateInstallment(idx, 'date', e.target.value)} className="w-36" />
                                  </TableCell>
                                  <TableCell>
                                    <Input type="number" value={inst.amount} onChange={(e) => updateInstallment(idx, 'amount', Number(e.target.value))} className="w-32" />
                                  </TableCell>
                                  <TableCell>
                                    <Select value={inst.status} onValueChange={(v) => updateInstallment(idx, 'status', v)}>
                                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="expected">Attendu</SelectItem>
                                        <SelectItem value="paid">Payé</SelectItem>
                                        <SelectItem value="late">En retard</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input type="number" value={inst.received ?? ''} onChange={(e) => updateInstallment(idx, 'received', Number(e.target.value))} className="w-28" />
                                  </TableCell>
                                  <TableCell>
                                    <Input type="date" value={inst.received_date ?? ''} onChange={(e) => updateInstallment(idx, 'received_date', e.target.value)} className="w-36" />
                                  </TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => removeInstallment(idx)} className="text-red-600">Suppr.</Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section E: Statut & Actions ── */}
              <TabsContent value="statut" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Statut & Actions</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Statut *</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as ReceivableEntry['status'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(receivableStatusLabels) as [ReceivableEntry['status'], string][]).map(([k, label]) => (
                              <SelectItem key={k} value={k}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priorité</Label>
                        <Select value={priority} onValueChange={(v) => setPriority(v as ReceivableEntry['priority'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">Haute</SelectItem>
                            <SelectItem value="normal">Normale</SelectItem>
                            <SelectItem value="low">Basse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Responsable</Label>
                        <Select defaultValue="">
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="usr-001">Kouadio Aya</SelectItem>
                            <SelectItem value="usr-002">Bamba Seydou</SelectItem>
                            <SelectItem value="usr-003">N'Guessan Marc</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(status === 'disputed' || status === 'litigation' || status === 'irrecoverable') && (
                      <div className="space-y-2">
                        <Label>Motif du statut</Label>
                        <Textarea value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
                      </div>
                    )}

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Prochaine action</Label>
                        <Select value={nextAction ?? 'none'} onValueChange={(v) => setNextAction(v as ReceivableEntry['next_action'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            <SelectItem value="phone_call">Appel téléphonique</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="formal_notice">Mise en demeure</SelectItem>
                            <SelectItem value="payment_order">Injonction de payer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date de la prochaine action</Label>
                        <Input type="date" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Modèle de relance</Label>
                        <Select value={reminderTemplate ?? ''} onValueChange={(v) => setReminderTemplate(v as ReceivableEntry['reminder_template'])}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reminder_1">Relance 1 - Amiable</SelectItem>
                            <SelectItem value="reminder_2">Relance 2 - Ferme</SelectItem>
                            <SelectItem value="formal_notice">Mise en demeure</SelectItem>
                            <SelectItem value="lawyer_letter">Courrier avocat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm">Générer relance</Button>
                      <Button variant="outline" size="sm">Envoyer relance</Button>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-3">
                      <Label>Lier à un dossier contentieux</Label>
                      <Switch checked={linkedDispute} onCheckedChange={setLinkedDispute} />
                      {linkedDispute && <Badge variant="destructive">Contentieux lié</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section F: Rapprochement ── */}
              <TabsContent value="rapprochement" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Rapprochement bancaire</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Suggestion de rapprochement</p>
                            <p className="text-sm text-muted-foreground">
                              Un virement de <span className="font-bold">{fmtFCFA(balanceTTC > 0 ? Math.round(balanceTTC * 0.8) : 1_000_000)}</span> reçu le {fmtDate(new Date().toISOString().split('T')[0])} de <span className="font-semibold">{debtorName || 'DÉBITEUR'}</span> correspond potentiellement à cette créance.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm">Imputer</Button>
                          <Button size="sm" variant="outline">Ignorer</Button>
                          <Button size="sm" variant="outline">Imputation partielle</Button>
                        </div>
                      </CardContent>
                    </Card>
                    <p className="text-xs text-muted-foreground">Le rapprochement automatique compare les virements reçus avec les créances ouvertes par montant et nom de contrepartie.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section G: Pièces justificatives ── */}
              <TabsContent value="pieces" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Pièces justificatives</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Facture</Label>
                      <Input value={invoiceFile} onChange={(e) => setInvoiceFile(e.target.value)} placeholder="facture.pdf" />
                    </div>
                    <div className="space-y-2">
                      <Label>Fichiers de relance</Label>
                      <Input placeholder="relance_1.pdf, relance_2.pdf" />
                    </div>
                    <div className="space-y-2">
                      <Label>Correspondances</Label>
                      <Input placeholder="correspondance.pdf" />
                    </div>
                    <div className="space-y-2">
                      <Label>Accord / convention</Label>
                      <Input placeholder="accord_echelonnement.pdf" />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes complémentaires..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section H: Historique règlements ── */}
              <TabsContent value="historique" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Historique des règlements</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                        Enregistrer un règlement
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showPaymentForm && (
                      <Card className="border-dashed">
                        <CardContent className="p-4 space-y-3">
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Date</Label>
                              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Montant (FCFA)</Label>
                              <Input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Mode</Label>
                              <Select value={payMethod} onValueChange={setPayMethod}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Virement bancaire">Virement bancaire</SelectItem>
                                  <SelectItem value="Chèque">Chèque</SelectItem>
                                  <SelectItem value="Espèces">Espèces</SelectItem>
                                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Compte</Label>
                              <Input value={payAccount} onChange={(e) => setPayAccount(e.target.value)} placeholder="SGBCI - Courant" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={recordPayment}>Valider</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowPaymentForm(false)}>Annuler</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Aucun règlement enregistré.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Compte</TableHead>
                            <TableHead>Solde après</TableHead>
                            <TableHead>Enregistré par</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((p, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{fmtDate(p.date)}</TableCell>
                              <TableCell className="font-medium">{fmtFCFA(p.amount)}</TableCell>
                              <TableCell>{p.method}</TableCell>
                              <TableCell>{p.account}</TableCell>
                              <TableCell>{fmtFCFA(p.balance_after)}</TableCell>
                              <TableCell>{p.recorded_by}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* ── Récapitulatif dynamique ── */}
            <Separator className="my-4" />
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Débiteur:</span>{' '}
                    <span className="font-medium">{debtorName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nature:</span>{' '}
                    <span className="font-medium">{receivableNatureLabels[nature]}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TTC:</span>{' '}
                    <span className="font-bold">{fmtFCFA(amountTTC)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Intérêts:</span>{' '}
                    <span className="font-medium text-red-600">{fmtFCFA(lateInterestComputed)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total dû:</span>{' '}
                    <span className="font-bold text-orange-700">{fmtFCFA(totalDue)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Règlements:</span>{' '}
                    <span className="font-medium">{fmtFCFA(partialPayments)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Solde:</span>{' '}
                    <span className="font-bold">{fmtFCFA(balanceTTC)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recouvrable:</span>{' '}
                    <span className="font-medium">{fmtFCFA(recoverableAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Probabilité:</span>{' '}
                    <Badge variant={probabilityPct >= 80 ? 'success' : probabilityPct >= 50 ? 'warning' : 'destructive'} className="ml-1">{probabilityPct}%</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prescription:</span>{' '}
                    <span className="font-medium">{fmtDate(prescriptionDate)}</span>
                    {prescriptionAlert && <Badge variant="destructive" className="ml-1 text-[10px]">Alerte</Badge>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Statut:</span>{' '}
                    <Badge variant={statusBadgeVariant(status)} className="ml-1">{receivableStatusLabels[status]}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Impact prév.:</span>{' '}
                    <span className="font-bold text-blue-700">{fmtFCFA(forecastBase)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-background">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowPaymentForm(true); setTab('historique'); }}>
              Enregistrer un règlement
            </Button>
            <Button variant="outline" size="sm">Générer relance</Button>
            {(status === 'late' || status === 'disputed') && (
              <Button variant="destructive" size="sm" onClick={() => { setStatus('litigation'); setTab('statut'); }}>
                Ouvrir contentieux
              </Button>
            )}
            <Button onClick={handleSave} disabled={isLoading || !debtorName}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

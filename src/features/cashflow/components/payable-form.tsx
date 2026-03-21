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
import type {
  PayableEntry,
  PayablePayment,
  DOAProgress,
} from '../types';
import {
  payableNatures,
  payableNatureLabels,
  payableStatusLabels,
} from '../types';

// ── Helpers ──
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function generateReference(): string {
  const yr = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `DET-${yr}-${seq}`;
}

function computeDelay(dueDate: string): number {
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function computeVAT(ht: number, rate: number): number {
  return Math.round(ht * rate / 100);
}

function fmtFCFA(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(v) + ' FCFA';
}

function fmtDate(d: string): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('fr-FR');
}

function computeDOARoles(amount: number): string[] {
  if (amount >= 10_000_000) return ['Trésorier', 'DAF', 'DG'];
  if (amount >= 5_000_000) return ['Trésorier', 'DAF'];
  return ['Trésorier'];
}

// ── Types ──
interface PayableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<PayableEntry>) => void;
  entry?: PayableEntry | null;
  isLoading?: boolean;
}

type Tab = 'identification' | 'montants' | 'temporalite' | 'statut' | 'lettre_change' | 'pieces' | 'historique';

// ── Component ──
export function PayableForm({ open, onOpenChange, onSave, entry, isLoading }: PayableFormProps) {
  const isEdit = !!entry?.id;

  // ── State ──
  const [tab, setTab] = useState<Tab>('identification');
  const [reference] = useState(() => entry?.reference || generateReference());
  const [creditorName, setCreditorName] = useState(entry?.creditor_name ?? '');
  const [nature, setNature] = useState<PayableEntry['nature']>(entry?.nature ?? 'supplier_invoice');
  const [subNature, setSubNature] = useState(entry?.sub_nature ?? '');
  const [poRef, setPoRef] = useState(entry?.purchase_order_ref ?? '');
  const [costCenter, setCostCenter] = useState(entry?.cost_center ?? '');
  const [budgetLineRef, setBudgetLineRef] = useState(entry?.budget_line_ref ?? '');

  // 3-Way Matching
  const [poAmount, setPoAmount] = useState(entry?.po_amount ?? 0);
  const [deliveryAmount, setDeliveryAmount] = useState(entry?.delivery_amount ?? 0);
  const [invoiceAmountHT, setInvoiceAmountHT] = useState(entry?.invoice_amount_ht ?? 0);
  const [vatRate, setVatRate] = useState(entry?.vat_deductible ?? 18);
  const [invoiceCurrency, setInvoiceCurrency] = useState(entry?.invoice_currency ?? 'XOF');
  const [fxRate, setFxRate] = useState(entry?.fx_rate ?? 1);
  const [paymentsMade, setPaymentsMade] = useState(entry?.payments_made ?? 0);
  const [hasRetention, setHasRetention] = useState(entry?.has_retention ?? false);
  const [retentionRate, setRetentionRate] = useState(entry?.retention_rate ?? 5);
  const [latePenalties, setLatePenalties] = useState(entry?.late_penalties ?? 0);
  const [hasEarlyDiscount, setHasEarlyDiscount] = useState(entry?.has_early_discount ?? false);
  const [discountPct, setDiscountPct] = useState(3); // default 3%
  const [creditNoteAmount, setCreditNoteAmount] = useState(entry?.credit_note_amount ?? 0);
  const [creditNoteRef, setCreditNoteRef] = useState(entry?.credit_note_ref ?? '');

  // Temporality
  const [servicePeriods, setServicePeriods] = useState<string[]>(entry?.service_periods ?? []);
  const [invoiceDate, setInvoiceDate] = useState(entry?.invoice_date ?? new Date().toISOString().split('T')[0]);
  const [receiptDate, setReceiptDate] = useState(entry?.receipt_date ?? new Date().toISOString().split('T')[0]);
  const [contractualDelay] = useState(30); // default 30 days
  const [plannedPaymentDate, setPlannedPaymentDate] = useState(entry?.planned_payment_date ?? '');
  const [priorityState, setPriorityState] = useState<PayableEntry['priority']>(entry?.priority ?? 'normal');
  const [disbursementAccountId, setDisbursementAccountId] = useState(entry?.disbursement_account_id ?? '');

  // Status & DOA
  const [status, setStatus] = useState<PayableEntry['status']>(entry?.status ?? 'to_approve');
  const [disputeReason, setDisputeReason] = useState(entry?.dispute_reason ?? '');
  const [isUrgent, setIsUrgent] = useState(entry?.is_urgent ?? false);
  const [urgentReason, setUrgentReason] = useState(entry?.urgent_reason ?? '');
  const [doaProgress, setDoaProgress] = useState<DOAProgress[]>(entry?.doa_progress ?? []);

  // Letter of Exchange
  const [hasLetterOfExchange, setHasLetterOfExchange] = useState(entry?.has_letter_of_exchange ?? false);
  const [loeRef, setLoeRef] = useState(entry?.loe_ref ?? '');
  const [loeIssueDate, setLoeIssueDate] = useState(entry?.loe_issue_date ?? '');
  const [loeDueDate, setLoeDueDate] = useState(entry?.loe_due_date ?? '');
  const [loeBank, setLoeBank] = useState(entry?.loe_bank ?? '');
  const [loeStatus, setLoeStatus] = useState<PayableEntry['loe_status']>(entry?.loe_status ?? 'issued');

  // Files
  const [invoiceFile, setInvoiceFile] = useState(entry?.invoice_file ?? '');
  const [poFile, setPoFile] = useState(entry?.po_file ?? '');
  const [deliveryFile, setDeliveryFile] = useState(entry?.delivery_file ?? '');
  const [creditNoteFile, setCreditNoteFile] = useState(entry?.credit_note_file ?? '');
  const [contractFile, setContractFile] = useState(entry?.contract_file ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');

  // Payment recording
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState(0);
  const [payAccount, setPayAccount] = useState('');
  const [payReference, setPayReference] = useState('');
  const [payRetention, setPayRetention] = useState(0);
  const [payments, setPayments] = useState<PayablePayment[]>(entry?.payments ?? []);

  // ── Computed ──
  const poVariance = useMemo(() => poAmount > 0 ? invoiceAmountHT - poAmount : 0, [invoiceAmountHT, poAmount]);
  const deliveryVariance = useMemo(() => deliveryAmount > 0 ? invoiceAmountHT - deliveryAmount : 0, [invoiceAmountHT, deliveryAmount]);
  const matchingStatus = useMemo((): PayableEntry['matching_status'] => {
    if (poVariance !== 0) return 'po_variance';
    if (deliveryVariance !== 0) return 'delivery_variance';
    return 'conforming';
  }, [poVariance, deliveryVariance]);

  const amountVAT = useMemo(() => computeVAT(invoiceAmountHT, vatRate), [invoiceAmountHT, vatRate]);
  const amountTTC = useMemo(() => invoiceAmountHT + amountVAT, [invoiceAmountHT, amountVAT]);
  const amountFCFA = useMemo(() => invoiceCurrency !== 'XOF' ? Math.round(amountTTC * fxRate) : amountTTC, [amountTTC, invoiceCurrency, fxRate]);
  const balanceRemaining = useMemo(() => Math.max(0, amountTTC - paymentsMade), [amountTTC, paymentsMade]);
  const retentionAmount = useMemo(() => hasRetention ? Math.round(amountTTC * retentionRate / 100) : 0, [amountTTC, hasRetention, retentionRate]);
  const netPayableNow = useMemo(() => Math.max(0, amountTTC - retentionAmount), [amountTTC, retentionAmount]);
  const discountAmount = useMemo(() => hasEarlyDiscount ? Math.round(invoiceAmountHT * discountPct / 100) : 0, [invoiceAmountHT, hasEarlyDiscount, discountPct]);
  const finalNetAmount = useMemo(() => Math.max(0, amountTTC - retentionAmount - discountAmount - creditNoteAmount), [amountTTC, retentionAmount, discountAmount, creditNoteAmount]);

  // Due date computed from receipt + contractual delay
  const dueDate = useMemo(() => {
    if (!receiptDate) return '';
    const d = new Date(receiptDate);
    d.setDate(d.getDate() + contractualDelay);
    return d.toISOString().split('T')[0];
  }, [receiptDate, contractualDelay]);

  const currentDelay = useMemo(() => computeDelay(dueDate), [dueDate]);

  // Budget mock
  const budgetConsumed = useMemo(() => entry?.budget_consumed ?? 12_500_000, [entry]);
  const budgetRemaining = useMemo(() => entry?.budget_remaining ?? Math.max(0, 20_000_000 - budgetConsumed - invoiceAmountHT), [entry, budgetConsumed, invoiceAmountHT]);
  const budgetPct = useMemo(() => Math.min(100, Math.round((budgetConsumed + invoiceAmountHT) / 20_000_000 * 100)), [budgetConsumed, invoiceAmountHT]);

  // DOA roles computed from amount
  const doaRequiredRoles = useMemo(() => computeDOARoles(amountTTC), [amountTTC]);

  // Initialize DOA progress when roles change
  useEffect(() => {
    if (!entry && doaRequiredRoles.length > 0) {
      setDoaProgress(doaRequiredRoles.map(role => ({ role, status: 'pending' })));
    }
  }, [doaRequiredRoles, entry]);

  // Treasury impact
  const treasuryImpact = useMemo(() => ({
    before: 45_000_000, // mock current treasury
    after: 45_000_000 - finalNetAmount,
    ratio: Math.round(finalNetAmount / 45_000_000 * 100),
  }), [finalNetAmount]);

  // Period toggle
  const togglePeriod = useCallback((period: string) => {
    setServicePeriods(prev => prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]);
  }, []);

  // Record payment
  const recordPayment = useCallback(() => {
    if (payAmount <= 0) return;
    const payment: PayablePayment = {
      date: payDate,
      amount: payAmount,
      account: payAccount || 'Compte principal',
      reference: payReference || `VIR-${Date.now()}`,
      retention_deducted: payRetention,
      recorded_by: 'Utilisateur courant',
    };
    setPayments(prev => [...prev, payment]);
    setPaymentsMade(prev => prev + payAmount);
    setShowPaymentForm(false);
    setPayAmount(0);
    setPayRetention(0);
  }, [payDate, payAmount, payAccount, payReference, payRetention]);

  // Build & save
  const handleSave = useCallback(() => {
    const data: Partial<PayableEntry> = {
      ...(entry?.id ? { id: entry.id } : {}),
      reference,
      creditor_name: creditorName,
      nature,
      sub_nature: subNature || undefined,
      purchase_order_ref: poRef || undefined,
      cost_center: costCenter || undefined,
      budget_line_ref: budgetLineRef || undefined,
      budget_consumed: budgetConsumed,
      budget_remaining: budgetRemaining,
      po_amount: poAmount || undefined,
      delivery_amount: deliveryAmount || undefined,
      invoice_amount_ht: invoiceAmountHT,
      po_variance: poVariance,
      delivery_variance: deliveryVariance,
      matching_status: matchingStatus,
      vat_deductible: vatRate,
      amount_vat: amountVAT,
      amount_ttc: amountTTC,
      invoice_currency: invoiceCurrency,
      fx_rate: invoiceCurrency !== 'XOF' ? fxRate : undefined,
      amount_fcfa: invoiceCurrency !== 'XOF' ? amountFCFA : undefined,
      payments_made: paymentsMade,
      balance_remaining: balanceRemaining,
      has_retention: hasRetention,
      retention_rate: hasRetention ? retentionRate : undefined,
      retention_amount: retentionAmount,
      net_payable_now: netPayableNow,
      late_penalties: latePenalties,
      has_early_discount: hasEarlyDiscount,
      discount_amount: discountAmount || undefined,
      credit_note_amount: creditNoteAmount || undefined,
      credit_note_ref: creditNoteRef || undefined,
      final_net_amount: finalNetAmount,
      service_periods: servicePeriods.length > 0 ? servicePeriods : undefined,
      invoice_date: invoiceDate,
      receipt_date: receiptDate,
      due_date: dueDate,
      current_delay: currentDelay,
      planned_payment_date: plannedPaymentDate,
      priority: priorityState,
      disbursement_account_id: disbursementAccountId,
      status,
      doa_required_roles: doaRequiredRoles,
      doa_progress: doaProgress,
      dispute_reason: disputeReason || undefined,
      is_urgent: isUrgent,
      urgent_reason: urgentReason || undefined,
      has_letter_of_exchange: hasLetterOfExchange,
      loe_ref: loeRef || undefined,
      loe_issue_date: loeIssueDate || undefined,
      loe_due_date: loeDueDate || undefined,
      loe_bank: loeBank || undefined,
      loe_status: hasLetterOfExchange ? loeStatus : undefined,
      invoice_file: invoiceFile || undefined,
      po_file: poFile || undefined,
      delivery_file: deliveryFile || undefined,
      credit_note_file: creditNoteFile || undefined,
      contract_file: contractFile || undefined,
      notes: notes || undefined,
      payments,
    };
    onSave(data);
  }, [
    entry, reference, creditorName, nature, subNature, poRef, costCenter, budgetLineRef,
    budgetConsumed, budgetRemaining, poAmount, deliveryAmount, invoiceAmountHT,
    poVariance, deliveryVariance, matchingStatus, vatRate, amountVAT, amountTTC,
    invoiceCurrency, fxRate, amountFCFA, paymentsMade, balanceRemaining, hasRetention,
    retentionRate, retentionAmount, netPayableNow, latePenalties, hasEarlyDiscount,
    discountAmount, creditNoteAmount, creditNoteRef, finalNetAmount, servicePeriods,
    invoiceDate, receiptDate, dueDate, currentDelay, plannedPaymentDate, priorityState,
    disbursementAccountId, status, doaRequiredRoles, doaProgress, disputeReason,
    isUrgent, urgentReason, hasLetterOfExchange, loeRef, loeIssueDate, loeDueDate,
    loeBank, loeStatus, invoiceFile, poFile, deliveryFile, creditNoteFile, contractFile,
    notes, payments, onSave,
  ]);

  function matchingBadgeVariant(s: PayableEntry['matching_status']) {
    return s === 'conforming' ? 'success' as const : 'destructive' as const;
  }

  function matchingLabel(s: PayableEntry['matching_status']) {
    switch (s) {
      case 'conforming': return 'Conforme';
      case 'po_variance': return 'Ecart BC';
      case 'delivery_variance': return 'Ecart BL';
    }
  }

  function statusBadgeVariant(s: PayableEntry['status']) {
    switch (s) {
      case 'to_approve': return 'warning' as const;
      case 'approved': return 'success' as const;
      case 'scheduled': return 'default' as const;
      case 'paid': return 'success' as const;
      case 'disputed': return 'destructive' as const;
      case 'cancelled': return 'secondary' as const;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">
            {isEdit ? 'Modifier' : 'Nouvelle'} Dette — {reference}
          </DialogTitle>
          <DialogDescription>Formulaire 6 — Contrepartie Dette</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(95vh-180px)]">
          <div className="px-6 pb-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList className="grid grid-cols-7 w-full mb-4">
                <TabsTrigger value="identification">A. Ident.</TabsTrigger>
                <TabsTrigger value="montants">B. Montants</TabsTrigger>
                <TabsTrigger value="temporalite">C. Temp.</TabsTrigger>
                <TabsTrigger value="statut">D. Statut</TabsTrigger>
                <TabsTrigger value="lettre_change">E. LC</TabsTrigger>
                <TabsTrigger value="pieces">F. Pièces</TabsTrigger>
                <TabsTrigger value="historique">G. Hist.</TabsTrigger>
              </TabsList>

              {/* ── Section A: Identification ── */}
              <TabsContent value="identification" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Identification de la dette</CardTitle></CardHeader>
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
                      <Label>Nom du créancier *</Label>
                      <Input
                        value={creditorName}
                        onChange={(e) => setCreditorName(e.target.value)}
                        placeholder="Saisir le nom du créancier..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nature *</Label>
                        <Select value={nature} onValueChange={(v) => setNature(v as PayableEntry['nature'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {payableNatures.map((n) => (
                              <SelectItem key={n} value={n}>{payableNatureLabels[n]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sous-nature</Label>
                        <Input value={subNature} onChange={(e) => setSubNature(e.target.value)} placeholder="Ex: Maintenance informatique" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Réf. bon de commande</Label>
                        <Input value={poRef} onChange={(e) => setPoRef(e.target.value)} placeholder="BC-2026-XXXX" />
                      </div>
                      <div className="space-y-2">
                        <Label>Centre de coût</Label>
                        <Select value={costCenter} onValueChange={setCostCenter}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DSI">DSI</SelectItem>
                            <SelectItem value="Logistique">Logistique</SelectItem>
                            <SelectItem value="RH">Ressources Humaines</SelectItem>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Direction">Direction Générale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ligne budgétaire</Label>
                        <Input value={budgetLineRef} onChange={(e) => setBudgetLineRef(e.target.value)} placeholder="BUD-XXX-2026" />
                      </div>
                    </div>

                    {/* Budget consumption */}
                    <Card className="bg-muted/50">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Consommation budgétaire</span>
                          <span className="font-bold">{budgetPct}%</span>
                        </div>
                        <Progress value={budgetPct} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Consommé: {fmtFCFA(budgetConsumed)}</span>
                          <span>Restant: {fmtFCFA(budgetRemaining)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section B: Montants & 3-Way Matching ── */}
              <TabsContent value="montants" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Montants & Rapprochement 3 voies</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {/* 3-Way Matching */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Montant BC (FCFA)</Label>
                        <Input type="number" value={poAmount} onChange={(e) => setPoAmount(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Montant BL (FCFA)</Label>
                        <Input type="number" value={deliveryAmount} onChange={(e) => setDeliveryAmount(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Montant facture HT *</Label>
                        <Input type="number" value={invoiceAmountHT} onChange={(e) => setInvoiceAmountHT(Number(e.target.value))} />
                      </div>
                    </div>

                    {/* Variance alerts */}
                    <div className="flex items-center gap-3">
                      <Badge variant={matchingBadgeVariant(matchingStatus)}>{matchingLabel(matchingStatus)}</Badge>
                      {poVariance !== 0 && (
                        <Badge variant="destructive">Ecart BC: {poVariance > 0 ? '+' : ''}{fmtFCFA(poVariance)}</Badge>
                      )}
                      {deliveryVariance !== 0 && (
                        <Badge variant="destructive">Ecart BL: {deliveryVariance > 0 ? '+' : ''}{fmtFCFA(deliveryVariance)}</Badge>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Taux TVA déductible (%)</Label>
                        <Input type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Montant TVA</Label>
                        <div className="text-sm font-medium mt-2">{fmtFCFA(amountVAT)}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">Montant TTC</Label>
                        <div className="text-lg font-bold text-primary mt-1">{fmtFCFA(amountTTC)}</div>
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Devise facture</Label>
                        <Select value={invoiceCurrency} onValueChange={setInvoiceCurrency}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XOF">XOF (FCFA)</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {invoiceCurrency !== 'XOF' && (
                        <>
                          <div className="space-y-2">
                            <Label>Taux de change</Label>
                            <Input type="number" step="0.01" value={fxRate} onChange={(e) => setFxRate(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Contre-valeur FCFA</Label>
                            <div className="text-sm font-bold mt-2">{fmtFCFA(amountFCFA)}</div>
                          </div>
                        </>
                      )}
                    </div>

                    <Separator />

                    {/* Payments, retention, discount */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Acomptes versés</Label>
                        <Input type="number" value={paymentsMade} onChange={(e) => setPaymentsMade(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Solde restant</Label>
                        <div className="text-sm font-bold text-orange-600 mt-2">{fmtFCFA(balanceRemaining)}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Retenue de garantie</Label>
                          <Switch checked={hasRetention} onCheckedChange={setHasRetention} />
                        </div>
                        {hasRetention && (
                          <div className="flex items-center gap-2 mt-1">
                            <Input type="number" value={retentionRate} onChange={(e) => setRetentionRate(Number(e.target.value))} className="w-16" />
                            <span className="text-xs">%</span>
                            <span className="text-xs font-medium">= {fmtFCFA(retentionAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Net payable immédiat</Label>
                        <div className="text-sm font-bold mt-2">{fmtFCFA(netPayableNow)}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Pénalités de retard</Label>
                        <Input type="number" value={latePenalties} onChange={(e) => setLatePenalties(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>Escompte</Label>
                          <Switch checked={hasEarlyDiscount} onCheckedChange={setHasEarlyDiscount} />
                        </div>
                        {hasEarlyDiscount && (
                          <div className="flex items-center gap-2 mt-1">
                            <Input type="number" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} className="w-16" />
                            <span className="text-xs">%</span>
                            <span className="text-xs font-medium">= -{fmtFCFA(discountAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Credit note */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Avoir / Note de crédit</Label>
                        <Input type="number" value={creditNoteAmount} onChange={(e) => setCreditNoteAmount(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Réf. avoir</Label>
                        <Input value={creditNoteRef} onChange={(e) => setCreditNoteRef(e.target.value)} placeholder="AV-2026-XXXX" />
                      </div>
                    </div>

                    <Separator />

                    {/* Final amount */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4 flex items-center justify-between">
                        <span className="text-lg font-semibold">MONTANT NET FINAL</span>
                        <span className="text-2xl font-bold text-primary">{fmtFCFA(finalNetAmount)}</span>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section C: Temporalité ── */}
              <TabsContent value="temporalite" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Temporalité</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Périodes de service</Label>
                      <div className="flex flex-wrap gap-2">
                        {MONTHS_FR.map((m, idx) => {
                          const val = `2026-${String(idx + 1).padStart(2, '0')}`;
                          const selected = servicePeriods.includes(val);
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
                        <Label>Date facture</Label>
                        <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de réception</Label>
                        <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Échéance (calculée: réception + {contractualDelay}j)</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-medium">{fmtDate(dueDate)}</span>
                          {currentDelay > 0 && (
                            <Badge variant="destructive">{currentDelay} jours de retard</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Date de paiement prévue</Label>
                        <Input type="date" value={plannedPaymentDate} onChange={(e) => setPlannedPaymentDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Priorité</Label>
                        <Select value={priorityState} onValueChange={(v) => setPriorityState(v as PayableEntry['priority'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="deferrable">Reportable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Compte de décaissement</Label>
                        <Select value={disbursementAccountId} onValueChange={setDisbursementAccountId}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acc-001">SGBCI - Compte courant</SelectItem>
                            <SelectItem value="acc-002">BIAO-CI - Compte courant</SelectItem>
                            <SelectItem value="acc-003">Ecobank - Compte opérationnel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Treasury impact simulation */}
                    <Separator />
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Simulation impact trésorerie</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Solde avant:</span>
                            <div className="font-bold text-green-700">{fmtFCFA(treasuryImpact.before)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Décaissement:</span>
                            <div className="font-bold text-red-600">-{fmtFCFA(finalNetAmount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Solde après:</span>
                            <div className={`font-bold ${treasuryImpact.after >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {fmtFCFA(treasuryImpact.after)}
                            </div>
                          </div>
                        </div>
                        <Progress value={100 - treasuryImpact.ratio} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Ce paiement représente {treasuryImpact.ratio}% du solde courant
                        </p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section D: Statut & DOA ── */}
              <TabsContent value="statut" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Statut & Délégation d'autorité (DOA)</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as PayableEntry['status'])}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(payableStatusLabels) as [PayableEntry['status'], string][]).map(([k, label]) => (
                              <SelectItem key={k} value={k}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 pt-7">
                        <Badge variant={statusBadgeVariant(status)}>{payableStatusLabels[status]}</Badge>
                      </div>
                    </div>

                    {/* DOA Stepper */}
                    <Separator />
                    <div className="space-y-3">
                      <Label className="font-semibold">Circuit d'approbation (DOA)</Label>
                      <p className="text-xs text-muted-foreground">
                        Montant TTC: {fmtFCFA(amountTTC)} — Niveau requis: {doaRequiredRoles.join(' > ')}
                      </p>
                      <div className="flex items-center gap-4">
                        {doaProgress.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`flex flex-col items-center p-3 rounded-lg border-2 min-w-[120px] ${
                              step.status === 'approved' ? 'border-green-500 bg-green-50' :
                              step.status === 'rejected' ? 'border-red-500 bg-red-50' :
                              'border-gray-300 bg-gray-50'
                            }`}>
                              <span className="text-xs font-medium">{step.role}</span>
                              <Badge
                                variant={step.status === 'approved' ? 'success' : step.status === 'rejected' ? 'destructive' : 'secondary'}
                                className="mt-1 text-[10px]"
                              >
                                {step.status === 'approved' ? 'Approuvé' : step.status === 'rejected' ? 'Rejeté' : 'En attente'}
                              </Badge>
                              {step.name && <span className="text-[10px] text-muted-foreground mt-1">{step.name}</span>}
                              {step.date && <span className="text-[10px] text-muted-foreground">{fmtDate(step.date)}</span>}
                            </div>
                            {idx < doaProgress.length - 1 && (
                              <div className="w-8 h-0.5 bg-gray-300" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dispute */}
                    {status === 'disputed' && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label>Motif du litige</Label>
                          <Textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Décrivez le motif..." />
                        </div>
                      </>
                    )}

                    {/* Urgency */}
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Label>Paiement urgent</Label>
                        <Switch checked={isUrgent} onCheckedChange={setIsUrgent} />
                        {isUrgent && <Badge variant="destructive">URGENT</Badge>}
                      </div>
                      {isUrgent && (
                        <div className="space-y-2">
                          <Label>Motif de l'urgence</Label>
                          <Input value={urgentReason} onChange={(e) => setUrgentReason(e.target.value)} placeholder="Ex: Pénalité de retard imminente" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section E: Lettre de change ── */}
              <TabsContent value="lettre_change" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Lettre de change</CardTitle>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Activer</Label>
                        <Switch checked={hasLetterOfExchange} onCheckedChange={setHasLetterOfExchange} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!hasLetterOfExchange ? (
                      <p className="text-sm text-muted-foreground">Aucune lettre de change. Activez le toggle pour configurer.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Référence LC</Label>
                            <Input value={loeRef} onChange={(e) => setLoeRef(e.target.value)} placeholder="LC-2026-XXXX" />
                          </div>
                          <div className="space-y-2">
                            <Label>Banque</Label>
                            <Select value={loeBank} onValueChange={setLoeBank}>
                              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SGBCI">SGBCI</SelectItem>
                                <SelectItem value="BIAO-CI">BIAO-CI</SelectItem>
                                <SelectItem value="Ecobank">Ecobank</SelectItem>
                                <SelectItem value="BOA">BOA</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Date d'émission</Label>
                            <Input type="date" value={loeIssueDate} onChange={(e) => setLoeIssueDate(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Date d'échéance</Label>
                            <Input type="date" value={loeDueDate} onChange={(e) => setLoeDueDate(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select value={loeStatus} onValueChange={(v) => setLoeStatus(v as PayableEntry['loe_status'])}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="issued">Émise</SelectItem>
                                <SelectItem value="accepted">Acceptée</SelectItem>
                                <SelectItem value="paid">Payée</SelectItem>
                                <SelectItem value="unpaid">Impayée</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Section F: Pièces justificatives ── */}
              <TabsContent value="pieces" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Pièces justificatives</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Facture</Label>
                        <Input value={invoiceFile} onChange={(e) => setInvoiceFile(e.target.value)} placeholder="facture.pdf" />
                      </div>
                      <div className="space-y-2">
                        <Label>Bon de commande</Label>
                        <Input value={poFile} onChange={(e) => setPoFile(e.target.value)} placeholder="bon_commande.pdf" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bon de livraison</Label>
                        <Input value={deliveryFile} onChange={(e) => setDeliveryFile(e.target.value)} placeholder="bon_livraison.pdf" />
                      </div>
                      <div className="space-y-2">
                        <Label>Note de crédit / Avoir</Label>
                        <Input value={creditNoteFile} onChange={(e) => setCreditNoteFile(e.target.value)} placeholder="avoir.pdf" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contrat</Label>
                      <Input value={contractFile} onChange={(e) => setContractFile(e.target.value)} placeholder="contrat.pdf" />
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

              {/* ── Section G: Historique paiements ── */}
              <TabsContent value="historique" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Historique des paiements</CardTitle>
                      <Button variant="outline" size="sm" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                        Enregistrer un paiement
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
                              <Label className="text-xs">Compte</Label>
                              <Input value={payAccount} onChange={(e) => setPayAccount(e.target.value)} placeholder="SGBCI - Courant" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Référence virement</Label>
                              <Input value={payReference} onChange={(e) => setPayReference(e.target.value)} placeholder="VIR-2026-XXXX" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Retenue déduite</Label>
                            <Input type="number" value={payRetention} onChange={(e) => setPayRetention(Number(e.target.value))} className="w-40" />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={recordPayment}>Valider</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowPaymentForm(false)}>Annuler</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement enregistré.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Compte</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Retenue déduite</TableHead>
                            <TableHead>Enregistré par</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((p, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{fmtDate(p.date)}</TableCell>
                              <TableCell className="font-medium">{fmtFCFA(p.amount)}</TableCell>
                              <TableCell>{p.account}</TableCell>
                              <TableCell>{p.reference}</TableCell>
                              <TableCell>{fmtFCFA(p.retention_deducted)}</TableCell>
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
                    <span className="text-muted-foreground">Créancier:</span>{' '}
                    <span className="font-medium">{creditorName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nature:</span>{' '}
                    <span className="font-medium">{payableNatureLabels[nature]}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Matching:</span>{' '}
                    <Badge variant={matchingBadgeVariant(matchingStatus)} className="ml-1">{matchingLabel(matchingStatus)}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TTC:</span>{' '}
                    <span className="font-bold">{fmtFCFA(amountTTC)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retenue:</span>{' '}
                    <span className="font-medium">{fmtFCFA(retentionAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Net payable:</span>{' '}
                    <span className="font-bold text-primary">{fmtFCFA(finalNetAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payé:</span>{' '}
                    <span className="font-medium">{fmtFCFA(paymentsMade)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Solde:</span>{' '}
                    <span className="font-bold text-orange-600">{fmtFCFA(balanceRemaining)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Échéance:</span>{' '}
                    <span className="font-medium">{fmtDate(dueDate)}</span>
                    {currentDelay > 0 && <Badge variant="destructive" className="ml-1 text-[10px]">+{currentDelay}j</Badge>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Compte:</span>{' '}
                    <span className="font-medium">{disbursementAccountId || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Impact trés.:</span>{' '}
                    <span className="font-bold text-red-600">-{fmtFCFA(finalNetAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget restant:</span>{' '}
                    <span className={`font-medium ${budgetRemaining < 0 ? 'text-red-600' : ''}`}>{fmtFCFA(budgetRemaining)}</span>
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
            {status !== 'disputed' && (
              <Button variant="outline" size="sm" onClick={() => { setStatus('disputed'); setTab('statut'); }}>
                Contester
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setShowPaymentForm(true); setTab('historique'); }}>
              Enregistrer un paiement
            </Button>
            <Button variant="outline" size="sm">Programmer virement</Button>
            <Button onClick={handleSave} disabled={isLoading || !creditorName}>
              {isLoading ? 'Enregistrement...' : status === 'to_approve' ? 'Soumettre pour approbation' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

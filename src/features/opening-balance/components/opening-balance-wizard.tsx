import { useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Building2,
  Landmark,
  Receipt,
  TrendingUp,
  CreditCard,
  FileText,
  HandCoins,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { BankAccount } from '@/types/database';
import type {
  OpeningBalanceHeader,
  BankOpeningBalance,
  TaxOpeningBalance,
  OpeningInvestment,
  OpeningLoan,
  PriorReceivable,
  PriorPayable,
  ApprovalStep,
  FullOpeningBalanceData,
} from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { ReceivablesPortfolio } from './receivables-portfolio';
import { PayablesPortfolio } from './payables-portfolio';

const TOTAL_STEPS = 9;

const STEP_CONFIG = [
  { label: 'En-tête', icon: Building2 },
  { label: 'Soldes bancaires', icon: Landmark },
  { label: 'Solde fiscal', icon: Receipt },
  { label: 'Placements', icon: TrendingUp },
  { label: 'Emprunts', icon: CreditCard },
  { label: 'Créances', icon: FileText },
  { label: 'Dettes', icon: HandCoins },
  { label: 'Approbation', icon: ShieldCheck },
  { label: 'Synthèse', icon: BarChart3 },
];

const OPENING_TYPE_LABELS: Record<OpeningBalanceHeader['opening_type'], string> = {
  cashpilot_start: 'Démarrage CashPilot',
  fiscal_year_start: 'Début d\'exercice fiscal',
  post_closing: 'Post-clôture',
};

const INSTRUMENT_LABELS: Record<OpeningInvestment['instrument'], string> = {
  term_deposit: 'Dépôt à terme (DAT)',
  treasury_bill: 'Bon du Trésor',
  money_market: 'OPCVM monétaire',
  bond: 'Obligation',
  other: 'Autre',
};

interface OpeningBalanceWizardProps {
  bankAccounts: BankAccount[];
  initialHeader?: OpeningBalanceHeader;
  initialBankBalances?: BankOpeningBalance[];
  initialTaxBalance?: TaxOpeningBalance;
  initialInvestments?: OpeningInvestment[];
  initialLoans?: OpeningLoan[];
  initialReceivables?: PriorReceivable[];
  initialPayables?: PriorPayable[];
  initialApprovalSteps?: ApprovalStep[];
  onSubmit: (data: FullOpeningBalanceData) => void;
  isPending?: boolean;
}

export function OpeningBalanceWizard({
  bankAccounts,
  initialHeader,
  initialBankBalances = [],
  initialTaxBalance,
  initialInvestments = [],
  initialLoans = [],
  initialReceivables = [],
  initialPayables = [],
  initialApprovalSteps = [],
  onSubmit,
  isPending,
}: OpeningBalanceWizardProps) {
  const [step, setStep] = useState(1);

  // Section A - Header
  const [header, setHeader] = useState<OpeningBalanceHeader>(
    initialHeader ?? {
      company_id: '',
      opening_date: new Date().toISOString().split('T')[0],
      fiscal_year: new Date().getFullYear(),
      opening_type: 'fiscal_year_start',
      certified_by: '',
      notes: '',
    }
  );

  // Section B - Bank Balances
  const [bankBalances, setBankBalances] = useState<BankOpeningBalance[]>(initialBankBalances);

  // Section C - Tax Balance
  const [taxBalance, setTaxBalance] = useState<TaxOpeningBalance>(
    initialTaxBalance ?? {
      vat_collected_undeclared: 0,
      vat_deductible_pending: 0,
      corporate_tax_prepaid: 0,
      corporate_tax_remaining: 0,
      other_tax_liabilities: 0,
      tax_receivables: 0,
    }
  );

  // Section D - Investments
  const [investments, setInvestments] = useState<OpeningInvestment[]>(initialInvestments);

  // Section E - Loans
  const [loans, setLoans] = useState<OpeningLoan[]>(initialLoans);

  // Section F - Receivables
  const [receivables, setReceivables] = useState<PriorReceivable[]>(initialReceivables);

  // Section G - Payables
  const [payables, setPayables] = useState<PriorPayable[]>(initialPayables);

  // Section H - Approval
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>(initialApprovalSteps);

  // ─────────────────────────────────────────────────────────────────────────
  // Computed values
  // ─────────────────────────────────────────────────────────────────────────

  const totalBankAccounting = bankBalances.reduce((s, b) => s + b.accounting_balance, 0);
  const totalBankAvailable = bankBalances.reduce((s, b) => s + b.available_balance, 0);
  const totalVariance = bankBalances.reduce((s, b) => s + b.variance, 0);

  const taxNetPosition =
    taxBalance.tax_receivables +
    taxBalance.corporate_tax_prepaid -
    taxBalance.vat_collected_undeclared -
    taxBalance.corporate_tax_remaining -
    taxBalance.other_tax_liabilities +
    taxBalance.vat_deductible_pending;

  const totalInvestments = investments.reduce((s, i) => s + i.amount, 0);
  const totalAccruedInterest = investments.reduce((s, i) => s + i.accrued_interest, 0);

  const totalLoansOutstanding = loans.reduce((s, l) => s + l.outstanding_capital, 0);

  const totalReceivablesWeighted = receivables
    .filter((r) => r.status !== 'irrecoverable')
    .reduce((s, r) => s + r.recoverable_amount * (r.probability_pct / 100), 0);

  const totalPayablesRemaining = payables.reduce((s, p) => s + p.balance_remaining, 0);

  const netOpeningPosition =
    totalBankAccounting +
    totalInvestments +
    totalAccruedInterest +
    totalReceivablesWeighted -
    totalLoansOutstanding -
    totalPayablesRemaining +
    taxNetPosition;

  // ─────────────────────────────────────────────────────────────────────────
  // Bank balance helpers
  // ─────────────────────────────────────────────────────────────────────────

  function updateBankBalance(accountId: string, updates: Partial<BankOpeningBalance>) {
    setBankBalances((prev) =>
      prev.map((b) => {
        if (b.account_id !== accountId) return b;
        const updated = { ...b, ...updates };
        updated.variance = updated.bank_balance - updated.accounting_balance;
        updated.available_balance =
          updated.accounting_balance -
          updated.checks_issued_pending +
          updated.checks_received_pending -
          updated.transfers_out_pending +
          updated.transfers_in_pending;
        return updated;
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Investment helpers
  // ─────────────────────────────────────────────────────────────────────────

  function addInvestment() {
    setInvestments((prev) => [
      ...prev,
      {
        id: `inv-${Date.now()}`,
        instrument: 'term_deposit',
        institution: '',
        amount: 0,
        rate: 0,
        start_date: '',
        maturity_date: '',
        accrued_interest: 0,
        repatriation_account_id: '',
      },
    ]);
  }

  function removeInvestment(id: string) {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  }

  function updateInvestment(id: string, updates: Partial<OpeningInvestment>) {
    setInvestments((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, ...updates };
        // Compute accrued interest
        if (updated.start_date && updated.amount && updated.rate) {
          const start = new Date(updated.start_date);
          const now = new Date(header.opening_date);
          const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          updated.accrued_interest = Math.round((updated.amount * updated.rate * days) / (365 * 100));
        }
        return updated;
      })
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Loan helpers
  // ─────────────────────────────────────────────────────────────────────────

  function addLoan() {
    setLoans((prev) => [
      ...prev,
      {
        id: `loan-${Date.now()}`,
        reference: '',
        lender: '',
        initial_capital: 0,
        outstanding_capital: 0,
        next_payment_date: '',
        next_payment_amount: 0,
      },
    ]);
  }

  function removeLoan(id: string) {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLoan(id: string, updates: Partial<OpeningLoan>) {
    setLoans((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Approval helpers
  // ─────────────────────────────────────────────────────────────────────────

  function handleApprove(role: ApprovalStep['role'], approver: string, comment: string) {
    setApprovalSteps((prev) =>
      prev.map((s) =>
        s.role === role
          ? {
              ...s,
              status: 'approved',
              approved_by: approver,
              approved_at: new Date().toISOString(),
              comment,
            }
          : s
      )
    );
  }

  function handleReject(role: ApprovalStep['role'], comment: string) {
    setApprovalSteps((prev) =>
      prev.map((s) =>
        s.role === role
          ? { ...s, status: 'rejected', comment, approved_at: new Date().toISOString() }
          : s
      )
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────────────────

  function handleConfirm() {
    onSubmit({
      header,
      bank_balances: bankBalances,
      tax_balance: taxBalance,
      investments,
      loans,
      receivables,
      payables,
      approval_steps: approvalSteps,
    });
  }

  const canProceedStep1 = header.fiscal_year > 0 && header.opening_date !== '';

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6">
      {/* Sidebar navigation */}
      <div className="hidden w-[220px] shrink-0 lg:block">
        <nav className="sticky top-4 space-y-1">
          {STEP_CONFIG.map((cfg, idx) => {
            const stepNum = idx + 1;
            const Icon = cfg.icon;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <Button
                key={stepNum}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start text-left ${
                  isCompleted ? 'text-green-600 dark:text-green-400' : ''
                }`}
                onClick={() => setStep(stepNum)}
              >
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="text-sm">{cfg.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => {
              const Icon = STEP_CONFIG[step - 1].icon;
              return <Icon className="h-5 w-5" />;
            })()}
            Balance d'ouverture - {STEP_CONFIG[step - 1].label}
          </CardTitle>
          <CardDescription>
            Étape {step} sur {TOTAL_STEPS}
          </CardDescription>
          <Progress value={(step / TOTAL_STEPS) * 100} className="mt-2" />
        </CardHeader>

        <CardContent className="min-h-[400px]">
          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 1: Header (Section A) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">En-tête de la balance d'ouverture</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Exercice fiscal</Label>
                  <Input
                    type="number"
                    min={2000}
                    max={2100}
                    value={header.fiscal_year}
                    onChange={(e) => setHeader({ ...header, fiscal_year: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date d'ouverture</Label>
                  <Input
                    type="date"
                    value={header.opening_date}
                    onChange={(e) => setHeader({ ...header, opening_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type d'ouverture</Label>
                  <Select
                    value={header.opening_type}
                    onValueChange={(v) =>
                      setHeader({ ...header, opening_type: v as OpeningBalanceHeader['opening_type'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OPENING_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Certifié par</Label>
                  <Input
                    value={header.certified_by ?? ''}
                    onChange={(e) => setHeader({ ...header, certified_by: e.target.value })}
                    placeholder="Nom et fonction"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={header.notes ?? ''}
                    onChange={(e) => setHeader({ ...header, notes: e.target.value })}
                    placeholder="Commentaires ou observations sur cette ouverture..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 2: Bank Balances (Section B) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Soldes bancaires d'ouverture</h3>
              <p className="text-sm text-muted-foreground">
                Saisissez les soldes comptables et bancaires pour chaque compte. L'écart et le solde disponible sont calculés automatiquement.
              </p>

              {bankBalances.map((bb, idx) => {
                const account = bankAccounts.find((a) => a.id === bb.account_id);
                const accountLabel = account
                  ? `${account.bank_name} - ${account.account_name}`
                  : bb.account_id;

                return (
                  <Card key={bb.account_id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{accountLabel}</CardTitle>
                      {account && (
                        <CardDescription>{account.currency} - {account.account_number}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Solde comptable</Label>
                          <Input
                            type="number"
                            value={bb.accounting_balance || ''}
                            onChange={(e) =>
                              updateBankBalance(bb.account_id, {
                                accounting_balance: Number(e.target.value) || 0,
                              })
                            }
                            className="h-8 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Solde relevé bancaire</Label>
                          <Input
                            type="number"
                            value={bb.bank_balance || ''}
                            onChange={(e) =>
                              updateBankBalance(bb.account_id, {
                                bank_balance: Number(e.target.value) || 0,
                              })
                            }
                            className="h-8 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Écart</Label>
                          <Input
                            type="number"
                            value={bb.variance}
                            readOnly
                            className={`h-8 bg-muted text-right ${
                              bb.variance !== 0 ? 'text-orange-600 font-medium' : ''
                            }`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Date relevé</Label>
                          <Input
                            type="date"
                            value={bb.statement_date}
                            onChange={(e) =>
                              updateBankBalance(bb.account_id, { statement_date: e.target.value })
                            }
                            className="h-8"
                          />
                        </div>
                      </div>

                      {bb.variance !== 0 && (
                        <div className="mt-3 space-y-1">
                          <Label className="text-xs text-orange-600">
                            Motif de l'écart (obligatoire si écart != 0)
                          </Label>
                          <Input
                            value={bb.variance_reason ?? ''}
                            onChange={(e) =>
                              updateBankBalance(bb.account_id, { variance_reason: e.target.value })
                            }
                            placeholder="Ex: chèques émis non débités..."
                            className="h-8 border-orange-300"
                          />
                        </div>
                      )}

                      <Separator className="my-3" />

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Chèques émis en attente</Label>
                          <Input
                            type="number"
                            value={bb.checks_issued_pending || ''}
                            onChange={(e) =>
                              updateBankBalance(bb.account_id, {
                                checks_issued_pending: Number(e.target.value) || 0,
                              })
                            }
                            className="h-8 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Chèques reçus en attente</Label>
                          <Input
                            type="number"
                            value={bb.checks_received_pending || ''}
                            onChange={(e) =>
                              updateBankBalance(bb.account_id, {
                                checks_received_pending: Number(e.target.value) || 0,
                              })
                            }
                            className="h-8 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Virements sortants en attente</Label>
                          <Input
                            type="number"
                            value={bb.transfers_out_pending || ''}
                            onChange={(e) =>
                              updateBankBalance(bb.account_id, {
                                transfers_out_pending: Number(e.target.value) || 0,
                              })
                            }
                            className="h-8 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Virements entrants en attente</Label>
                          <Input
                            type="number"
                            value={bb.transfers_in_pending || ''}
                            onChange={(e) =>
                              updateBankBalance(bb.account_id, {
                                transfers_in_pending: Number(e.target.value) || 0,
                              })
                            }
                            className="h-8 text-right"
                          />
                        </div>
                      </div>

                      <div className="mt-3 rounded-md bg-muted p-3 text-right">
                        <span className="text-sm text-muted-foreground">Solde disponible calculé: </span>
                        <span className="text-lg font-bold">
                          {formatCurrency(bb.available_balance, 'XOF')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Reconciliation Summary */}
              <Card className="border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Synthèse rapprochement bancaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total solde comptable:</span>
                      <span className="font-medium">{formatCurrency(totalBankAccounting, 'XOF')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total solde disponible:</span>
                      <span className="font-bold">{formatCurrency(totalBankAvailable, 'XOF')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Écart total:</span>
                      <span className={`font-medium ${totalVariance !== 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatCurrency(totalVariance, 'XOF')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 3: Tax Balance (Section C) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Position fiscale d'ouverture</h3>
              <p className="text-sm text-muted-foreground">
                Saisissez les positions fiscales en cours à la date d'ouverture.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600">Passifs fiscaux</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">TVA collectée non déclarée</Label>
                      <Input
                        type="number"
                        value={taxBalance.vat_collected_undeclared || ''}
                        onChange={(e) =>
                          setTaxBalance({ ...taxBalance, vat_collected_undeclared: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">IS restant à payer</Label>
                      <Input
                        type="number"
                        value={taxBalance.corporate_tax_remaining || ''}
                        onChange={(e) =>
                          setTaxBalance({ ...taxBalance, corporate_tax_remaining: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Autres dettes fiscales</Label>
                      <Input
                        type="number"
                        value={taxBalance.other_tax_liabilities || ''}
                        onChange={(e) =>
                          setTaxBalance({ ...taxBalance, other_tax_liabilities: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-600">Actifs fiscaux</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">TVA déductible en attente</Label>
                      <Input
                        type="number"
                        value={taxBalance.vat_deductible_pending || ''}
                        onChange={(e) =>
                          setTaxBalance({ ...taxBalance, vat_deductible_pending: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">IS acomptes versés</Label>
                      <Input
                        type="number"
                        value={taxBalance.corporate_tax_prepaid || ''}
                        onChange={(e) =>
                          setTaxBalance({ ...taxBalance, corporate_tax_prepaid: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Créances fiscales diverses</Label>
                      <Input
                        type="number"
                        value={taxBalance.tax_receivables || ''}
                        onChange={(e) =>
                          setTaxBalance({ ...taxBalance, tax_receivables: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-right"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-primary/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Position fiscale nette:</span>
                    <span
                      className={`text-xl font-bold ${
                        taxNetPosition >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(taxNetPosition, 'XOF')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {taxNetPosition >= 0
                      ? 'Position nette créditrice (actif fiscal)'
                      : 'Position nette débitrice (passif fiscal)'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 4: Active Investments (Section D) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Placements actifs</h3>
              <p className="text-sm text-muted-foreground">
                Listez les placements en cours à la date d'ouverture. Les intérêts courus sont calculés automatiquement.
              </p>

              {investments.map((inv) => (
                <Card key={inv.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {INSTRUMENT_LABELS[inv.instrument]} - {inv.institution || 'Nouveau placement'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeInvestment(inv.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Type d'instrument</Label>
                        <Select
                          value={inv.instrument}
                          onValueChange={(v) =>
                            updateInvestment(inv.id, { instrument: v as OpeningInvestment['instrument'] })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INSTRUMENT_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Établissement</Label>
                        <Input
                          value={inv.institution}
                          onChange={(e) => updateInvestment(inv.id, { institution: e.target.value })}
                          className="h-8"
                          placeholder="Ex: SGBCI"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Montant (FCFA)</Label>
                        <Input
                          type="number"
                          value={inv.amount || ''}
                          onChange={(e) => updateInvestment(inv.id, { amount: Number(e.target.value) || 0 })}
                          className="h-8 text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Taux (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={inv.rate || ''}
                          onChange={(e) => updateInvestment(inv.id, { rate: Number(e.target.value) || 0 })}
                          className="h-8 text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Date de début</Label>
                        <Input
                          type="date"
                          value={inv.start_date}
                          onChange={(e) => updateInvestment(inv.id, { start_date: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Date d'échéance</Label>
                        <Input
                          type="date"
                          value={inv.maturity_date}
                          onChange={(e) => updateInvestment(inv.id, { maturity_date: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Intérêts courus (calculé)</Label>
                        <Input
                          type="number"
                          value={inv.accrued_interest}
                          readOnly
                          className="h-8 bg-muted text-right font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Compte de rapatriement</Label>
                        <Select
                          value={inv.repatriation_account_id}
                          onValueChange={(v) => updateInvestment(inv.id, { repatriation_account_id: v })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.bank_name} - {a.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={addInvestment}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un placement
              </Button>

              <Card className="border-primary/50">
                <CardContent className="py-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capital placé:</span>
                      <span className="font-medium">{formatCurrency(totalInvestments, 'XOF')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Intérêts courus:</span>
                      <span className="font-medium text-green-600">{formatCurrency(totalAccruedInterest, 'XOF')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total placements:</span>
                      <span className="font-bold">{formatCurrency(totalInvestments + totalAccruedInterest, 'XOF')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 5: Active Loans (Section E) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Emprunts actifs</h3>
              <p className="text-sm text-muted-foreground">
                Listez les emprunts en cours avec leur capital restant dû et la prochaine échéance.
              </p>

              {loans.map((loan) => (
                <Card key={loan.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {loan.reference || 'Nouvel emprunt'} - {loan.lender || '...'}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeLoan(loan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Référence</Label>
                        <Input
                          value={loan.reference}
                          onChange={(e) => updateLoan(loan.id, { reference: e.target.value })}
                          className="h-8"
                          placeholder="PRET-..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prêteur</Label>
                        <Input
                          value={loan.lender}
                          onChange={(e) => updateLoan(loan.id, { lender: e.target.value })}
                          className="h-8"
                          placeholder="Ex: SGBCI"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Capital initial (FCFA)</Label>
                        <Input
                          type="number"
                          value={loan.initial_capital || ''}
                          onChange={(e) => updateLoan(loan.id, { initial_capital: Number(e.target.value) || 0 })}
                          className="h-8 text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Capital restant dû (FCFA)</Label>
                        <Input
                          type="number"
                          value={loan.outstanding_capital || ''}
                          onChange={(e) => updateLoan(loan.id, { outstanding_capital: Number(e.target.value) || 0 })}
                          className="h-8 text-right font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prochaine échéance</Label>
                        <Input
                          type="date"
                          value={loan.next_payment_date}
                          onChange={(e) => updateLoan(loan.id, { next_payment_date: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Montant prochaine échéance (FCFA)</Label>
                        <Input
                          type="number"
                          value={loan.next_payment_amount || ''}
                          onChange={(e) => updateLoan(loan.id, { next_payment_amount: Number(e.target.value) || 0 })}
                          className="h-8 text-right"
                        />
                      </div>
                    </div>
                    {loan.initial_capital > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Remboursé</span>
                          <span>
                            {Math.round(((loan.initial_capital - loan.outstanding_capital) / loan.initial_capital) * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={((loan.initial_capital - loan.outstanding_capital) / loan.initial_capital) * 100}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={addLoan}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un emprunt
              </Button>

              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="py-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total capital restant dû:</span>
                      <span className="font-bold text-red-600">{formatCurrency(totalLoansOutstanding, 'XOF')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prochaines échéances:</span>
                      <span className="font-medium">
                        {formatCurrency(loans.reduce((s, l) => s + l.next_payment_amount, 0), 'XOF')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 6: Prior Receivables (Section F) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 6 && (
            <ReceivablesPortfolio receivables={receivables} onChange={setReceivables} />
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 7: Prior Payables (Section G) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 7 && (
            <PayablesPortfolio payables={payables} onChange={setPayables} />
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 8: Approval Workflow (Section H) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 8 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Circuit d'approbation</h3>
              <p className="text-sm text-muted-foreground">
                Validation en 3 étapes: Trésorier, DAF, puis DG/DGA. Chaque étape doit être validée
                avant de passer à la suivante.
              </p>

              <div className="space-y-4">
                {approvalSteps.map((as, idx) => {
                  const isFirst = idx === 0;
                  const prevApproved = idx === 0 || approvalSteps[idx - 1]?.status === 'approved';
                  const canAct = prevApproved && as.status === 'pending';

                  return (
                    <Card
                      key={as.role}
                      className={`border-l-4 ${
                        as.status === 'approved'
                          ? 'border-l-green-500'
                          : as.status === 'rejected'
                          ? 'border-l-red-500'
                          : canAct
                          ? 'border-l-blue-500'
                          : 'border-l-gray-300'
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                as.status === 'approved'
                                  ? 'bg-green-100 text-green-600'
                                  : as.status === 'rejected'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {as.status === 'approved' ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : as.status === 'rejected' ? (
                                <XCircle className="h-5 w-5" />
                              ) : (
                                <span className="text-sm font-medium">{idx + 1}</span>
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-base">{as.label}</CardTitle>
                              {as.approved_by && (
                                <CardDescription>
                                  {as.status === 'approved' ? 'Approuvé' : 'Rejeté'} par {as.approved_by}
                                  {as.approved_at && ` le ${new Date(as.approved_at).toLocaleDateString('fr-FR')}`}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={
                              as.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : as.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {as.status === 'approved'
                              ? 'Approuvé'
                              : as.status === 'rejected'
                              ? 'Rejeté'
                              : 'En attente'}
                          </Badge>
                        </div>
                      </CardHeader>
                      {canAct && (
                        <CardContent>
                          <ApprovalActionPanel
                            onApprove={(name, comment) => handleApprove(as.role, name, comment)}
                            onReject={(comment) => handleReject(as.role, comment)}
                          />
                        </CardContent>
                      )}
                      {as.comment && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground italic">"{as.comment}"</p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* Step 9: Consolidated Summary (Section I) */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 9 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Synthèse consolidée de la balance d'ouverture</h3>

              {/* Header recap */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">A. En-tête</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Exercice: </span>
                      <span className="font-medium">{header.fiscal_year}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      <span className="font-medium">{header.opening_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type: </span>
                      <span className="font-medium">{OPENING_TYPE_LABELS[header.opening_type]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assets */}
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">ACTIFS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="font-medium">B. Trésorerie bancaire (comptable)</span>
                    <span className="font-medium">{formatCurrency(totalBankAccounting, 'XOF')}</span>
                  </div>
                  {bankBalances.map((bb) => {
                    const account = bankAccounts.find((a) => a.id === bb.account_id);
                    return (
                      <div key={bb.account_id} className="flex justify-between text-xs text-muted-foreground pl-4">
                        <span>{account ? `${account.bank_name} - ${account.account_name}` : bb.account_id}</span>
                        <span>{formatCurrency(bb.accounting_balance, 'XOF')}</span>
                      </div>
                    );
                  })}

                  <Separator />

                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="font-medium">D. Placements (capital + intérêts courus)</span>
                    <span className="font-medium">{formatCurrency(totalInvestments + totalAccruedInterest, 'XOF')}</span>
                  </div>
                  {investments.map((inv) => (
                    <div key={inv.id} className="flex justify-between text-xs text-muted-foreground pl-4">
                      <span>{INSTRUMENT_LABELS[inv.instrument]} - {inv.institution}</span>
                      <span>{formatCurrency(inv.amount + inv.accrued_interest, 'XOF')}</span>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="font-medium">F. Créances antérieures (pondérées)</span>
                    <span className="font-medium">{formatCurrency(totalReceivablesWeighted, 'XOF')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pl-4">
                    <span>{receivables.length} créances ({receivables.filter((r) => r.status === 'irrecoverable').length} irréc. exclues)</span>
                  </div>

                  <Separator />

                  {taxNetPosition > 0 && (
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">C. Position fiscale nette (actif)</span>
                      <span className="font-medium">{formatCurrency(taxNetPosition, 'XOF')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Liabilities */}
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">PASSIFS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="font-medium">E. Emprunts (capital restant dû)</span>
                    <span className="font-medium text-red-600">{formatCurrency(totalLoansOutstanding, 'XOF')}</span>
                  </div>
                  {loans.map((loan) => (
                    <div key={loan.id} className="flex justify-between text-xs text-muted-foreground pl-4">
                      <span>{loan.reference} - {loan.lender}</span>
                      <span>{formatCurrency(loan.outstanding_capital, 'XOF')}</span>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between text-sm border-b pb-2">
                    <span className="font-medium">G. Dettes antérieures</span>
                    <span className="font-medium text-red-600">{formatCurrency(totalPayablesRemaining, 'XOF')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pl-4">
                    <span>{payables.length} dettes ({payables.filter((p) => p.priority === 'urgent').length} urgentes)</span>
                  </div>

                  <Separator />

                  {taxNetPosition < 0 && (
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium">C. Position fiscale nette (passif)</span>
                      <span className="font-medium text-red-600">{formatCurrency(Math.abs(taxNetPosition), 'XOF')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Net position */}
              <Card className={netOpeningPosition >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}>
                <CardContent className="py-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Position nette d'ouverture
                    </p>
                    <p className={`text-3xl font-bold ${netOpeningPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netOpeningPosition, 'XOF')}
                    </p>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid gap-2 sm:grid-cols-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Actifs:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(
                          totalBankAccounting +
                            totalInvestments +
                            totalAccruedInterest +
                            totalReceivablesWeighted +
                            (taxNetPosition > 0 ? taxNetPosition : 0),
                          'XOF'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Passifs:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(
                          totalLoansOutstanding +
                            totalPayablesRemaining +
                            (taxNetPosition < 0 ? Math.abs(taxNetPosition) : 0),
                          'XOF'
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Approval status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">H. Statut d'approbation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {approvalSteps.map((as, idx) => (
                      <div key={as.role} className="flex items-center gap-2">
                        {idx > 0 && <div className="h-px w-8 bg-gray-300" />}
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            as.status === 'approved'
                              ? 'bg-green-500 text-white'
                              : as.status === 'rejected'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {as.status === 'approved' ? (
                            <Check className="h-3 w-3" />
                          ) : as.status === 'rejected' ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className="text-xs">{as.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              disabled={step === 1 && !canProceedStep1}
            >
              Suivant
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={isPending}>
              <Check className="mr-2 h-4 w-4" />
              {isPending ? 'Enregistrement...' : 'Confirmer et enregistrer'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Approval Action Panel (sub-component)
// ─────────────────────────────────────────────────────────────────────────────

function ApprovalActionPanel({
  onApprove,
  onReject,
}: {
  onApprove: (name: string, comment: string) => void;
  onReject: (comment: string) => void;
}) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Nom de l'approbateur</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8"
            placeholder="Nom et prénom"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Commentaire</Label>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-8"
            placeholder="Optionnel"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (name.trim()) onApprove(name.trim(), comment.trim());
          }}
          disabled={!name.trim()}
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Approuver
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onReject(comment.trim())}
        >
          <XCircle className="mr-1 h-3 w-3" />
          Rejeter
        </Button>
      </div>
    </div>
  );
}

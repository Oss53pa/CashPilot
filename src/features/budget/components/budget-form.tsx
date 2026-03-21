import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import {
  FileSpreadsheet, Save, Send, Download, GitCompare, X,
  ChevronDown, ChevronRight, Plus, Trash2, Calculator,
  Check, Clock, User, Building2, CalendarDays,
  Banknote, Settings2, Shield, Layers,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  budgetHeaderSchema,
  type BudgetHeaderInput,
  type BudgetLine,
  type BudgetSimulation,
  type SimulationResult,
  type BudgetApprovalStep,
  type CostCenterConfig,
  type EntryMode,
  type ComparisonView,
  type DistributionRuleType,
  type BudgetCategory,
} from '../types';
import { budgetService } from '../services/budget.service';
import { BudgetImport } from './budget-import';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  in_review: 'En validation',
  validated: 'Validé',
  archived: 'Archivé',
};

const TYPE_LABELS: Record<string, string> = {
  annual_fixed: 'Annuel fixe',
  rolling: 'Glissant',
  project: 'Par projet',
};

const SCOPE_LABELS: Record<string, string> = {
  company: 'Société seule',
  consolidated: 'Groupe consolidé',
};

const CURRENCY_LABELS: Record<string, string> = {
  XOF: 'XOF (FCFA BCEAO)',
  XAF: 'XAF (FCFA BEAC)',
  EUR: 'EUR (Euro)',
  USD: 'USD (Dollar US)',
};

const DISTRIBUTION_LABELS: Record<string, string> = {
  equal: 'Égal (1/12)',
  seasonal: 'Saisonnier',
  progressive: 'Progressif',
  manual: 'Manuel',
};

const CATEGORY_COLORS: Record<string, string> = {
  revenue: 'bg-green-50 dark:bg-green-950/30',
  opex: 'bg-red-50 dark:bg-red-950/20',
  financial: 'bg-orange-50 dark:bg-orange-950/20',
  capex: 'bg-blue-50 dark:bg-blue-950/20',
  loan_repayment: 'bg-purple-50 dark:bg-purple-950/20',
};

const APPROVAL_STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; label: string }> = {
  pending: { variant: 'secondary', label: 'En attente' },
  approved: { variant: 'success', label: 'Approuvé' },
  rejected: { variant: 'destructive', label: 'Rejeté' },
  skipped: { variant: 'outline', label: 'Passé' },
};

// ─── FCFA Formatting ─────────────────────────────────────────────────────────

function formatFCFA(centimes: number): string {
  const francs = Math.round(centimes / 100);
  return francs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatFCFADisplay(value: number): string {
  // value is in centimes, display as francs with space separators
  const francs = Math.round(value / 100);
  return francs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatFCFACompact(value: number): string {
  const francs = Math.round(value / 100);
  if (Math.abs(francs) >= 1000000) {
    return (francs / 1000000).toFixed(1).replace('.', ',') + ' M';
  }
  if (Math.abs(francs) >= 1000) {
    return (francs / 1000).toFixed(0) + ' K';
  }
  return francs.toString();
}

// ─── Compute end date from start ─────────────────────────────────────────────

function computeEndDate(startDate: string): string {
  if (!startDate) return '';
  const d = new Date(startDate);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetHeaderInput) => void;
  isPending?: boolean;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BudgetForm({ open, onOpenChange, onSubmit, isPending }: BudgetFormProps) {
  const currentYear = new Date().getFullYear();

  // ─── Reference data queries ────────────────────────────────────────────
  const { data: companies = [] } = useQuery({
    queryKey: ['ref', 'companies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: users = [] } = useQuery({
    queryKey: ['ref', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name').order('full_name');
      if (error) throw error;
      return (data ?? []).map((u: any) => ({ id: u.id, name: u.full_name ?? '' }));
    },
  });
  const { data: costCenters = [] } = useQuery({
    queryKey: ['ref', 'cost_centers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cost_centers').select('name').order('name');
      if (error) throw error;
      return (data ?? []).map((c: any) => c.name as string);
    },
  });
  const { data: budgetsList = [] } = useQuery({
    queryKey: ['ref', 'budgets_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budgets').select('id, name, fiscal_year').order('fiscal_year', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: counterpartiesList = [] } = useQuery({
    queryKey: ['ref', 'counterparties_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('counterparties').select('id, name').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Form state ──────────────────────────────────────────────────────────

  const form = useForm<BudgetHeaderInput>({
    resolver: zodResolver(budgetHeaderSchema),
    defaultValues: {
      name: '',
      company_id: '',
      fiscal_year: currentYear,
      start_date: `${currentYear}-01-01`,
      end_date: `${currentYear}-12-31`,
      currency: 'XOF',
      version: 'V1',
      status: 'draft',
      budget_type: 'annual_fixed',
      scope: 'company',
      responsible_id: '',
      notes: '',
    },
  });

  // ─── Section states ──────────────────────────────────────────────────────

  const [activeSection, setActiveSection] = useState('header');
  const [entryMode, setEntryMode] = useState<EntryMode>('manual');
  const [rollingHorizon, setRollingHorizon] = useState<12 | 18 | 24>(12);
  const [duplicateSourceId, setDuplicateSourceId] = useState('');
  const [duplicateRevisionPct, setDuplicateRevisionPct] = useState<Record<string, number>>({
    revenue: 0, opex: 0, financial: 0, capex: 0, loan_repayment: 0,
  });

  // Budget lines
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Cost center
  const [costCenterConfig, setCostCenterConfig] = useState<CostCenterConfig>({
    enabled: false,
    centers: [],
    allocation_key: 'manual',
  });

  // Simulation
  const [simulation, setSimulation] = useState<BudgetSimulation>({
    occupancy_rate: 95,
    avg_rent_variation: 3,
    energy_variation: 5,
    headcount: 12,
  });

  // Comparison
  const [comparisonView, setComparisonView] = useState<ComparisonView>('simple');

  // Approval
  const [approvalSteps, setApprovalSteps] = useState<BudgetApprovalStep[]>([]);

  // ─── Computed values ─────────────────────────────────────────────────────

  const startDate = form.watch('start_date');
  const endDate = useMemo(() => computeEndDate(startDate), [startDate]);

  // Update end_date when start_date changes
  useMemo(() => {
    if (endDate) form.setValue('end_date', endDate);
  }, [endDate]);

  // Simulation results
  const simulationResult: SimulationResult = useMemo(
    () => budgetService.simulateBudget(budgetLines, simulation),
    [budgetLines, simulation]
  );

  // Base totals
  const baseTotals = useMemo(() => {
    let revenues = 0;
    let charges = 0;
    for (const line of budgetLines) {
      if (line.level !== 1) continue;
      if (line.category === 'revenue') revenues = line.annual_total;
      else charges += line.annual_total;
    }
    return { revenues, charges, net: revenues - charges };
  }, [budgetLines]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const toggleNode = useCallback((id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updateLineMonth = useCallback((lineId: string, monthIndex: number, value: number) => {
    setBudgetLines((prev) => {
      const updated = prev.map((group) => {
        if (group.id === lineId) {
          const newMonths = [...group.months];
          newMonths[monthIndex] = value;
          return { ...group, months: newMonths, annual_total: newMonths.reduce((s, v) => s + v, 0) };
        }
        if (group.children) {
          const newChildren = group.children.map((child) => {
            if (child.id === lineId) {
              const newMonths = [...child.months];
              newMonths[monthIndex] = value;
              return { ...child, months: newMonths, annual_total: newMonths.reduce((s, v) => s + v, 0) };
            }
            return child;
          });
          // Recompute parent
          const parentMonths = Array(12).fill(0);
          newChildren.forEach((c) => c.months.forEach((v, i) => { parentMonths[i] += v; }));
          return {
            ...group,
            children: newChildren,
            months: parentMonths,
            annual_total: parentMonths.reduce((s, v) => s + v, 0),
          };
        }
        return group;
      });
      return updated;
    });
  }, []);

  const updateLineField = useCallback((lineId: string, field: string, value: string) => {
    setBudgetLines((prev) =>
      prev.map((group) => {
        if (group.id === lineId) return { ...group, [field]: value };
        if (group.children) {
          return {
            ...group,
            children: group.children.map((child) =>
              child.id === lineId ? { ...child, [field]: value } : child
            ),
          };
        }
        return group;
      })
    );
  }, []);

  const addSubLine = useCallback((parentId: string, category: BudgetCategory) => {
    setBudgetLines((prev) =>
      prev.map((group) => {
        if (group.id === parentId) {
          const newChild: BudgetLine = {
            id: `line-new-${Date.now()}`,
            budget_id: 'new-budget',
            parent_id: parentId,
            level: 2,
            code: `${category.toUpperCase()}-NEW`,
            label: '',
            category,
            hypothesis: '',
            annual_total: 0,
            months: Array(12).fill(0),
            distribution_rule: 'manual',
          };
          return {
            ...group,
            children: [...(group.children ?? []), newChild],
          };
        }
        return group;
      })
    );
  }, []);

  const removeSubLine = useCallback((parentId: string, childId: string) => {
    setBudgetLines((prev) =>
      prev.map((group) => {
        if (group.id === parentId && group.children) {
          const newChildren = group.children.filter((c) => c.id !== childId);
          const parentMonths = Array(12).fill(0);
          newChildren.forEach((c) => c.months.forEach((v, i) => { parentMonths[i] += v; }));
          return {
            ...group,
            children: newChildren,
            months: parentMonths,
            annual_total: parentMonths.reduce((s, v) => s + v, 0),
          };
        }
        return group;
      })
    );
  }, []);

  const applyDistributionToLine = useCallback((lineId: string, rule: DistributionRuleType) => {
    setBudgetLines((prev) =>
      prev.map((group) => {
        if (group.children) {
          const newChildren = group.children.map((child) => {
            if (child.id !== lineId) return child;
            const total = child.annual_total;
            let newMonths: number[];
            if (rule === 'equal') {
              const monthly = Math.round(total / 12);
              newMonths = Array(12).fill(monthly);
            } else if (rule === 'seasonal') {
              const weights = [7, 7, 8, 8, 9, 9, 7, 6, 9, 10, 10, 10];
              const totalW = weights.reduce((s, w) => s + w, 0);
              newMonths = weights.map((w) => Math.round((total * w) / totalW));
            } else if (rule === 'progressive') {
              const rate = 0.03;
              const base = total / (12 + (12 * 11 * rate) / 2);
              newMonths = Array.from({ length: 12 }, (_, i) => Math.round(base * (1 + rate * i)));
            } else {
              return { ...child, distribution_rule: rule };
            }
            return {
              ...child,
              months: newMonths,
              annual_total: newMonths.reduce((s, v) => s + v, 0),
              distribution_rule: rule,
            };
          });
          const parentMonths = Array(12).fill(0);
          newChildren.forEach((c) => c.months.forEach((v, i) => { parentMonths[i] += v; }));
          return {
            ...group,
            children: newChildren,
            months: parentMonths,
            annual_total: parentMonths.reduce((s, v) => s + v, 0),
          };
        }
        return group;
      })
    );
  }, []);

  const handleSaveDraft = useCallback(() => {
    const values = form.getValues();
    onSubmit({ ...values, status: 'draft' });
  }, [form, onSubmit]);

  const handleSubmitForApproval = useCallback(async () => {
    const values = form.getValues();
    onSubmit({ ...values, status: 'in_review' });
  }, [form, onSubmit]);

  const updateApprovalComment = useCallback((stepIndex: number, comment: string) => {
    setApprovalSteps((prev) =>
      prev.map((s, i) => (i === stepIndex ? { ...s, comment } : s))
    );
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Banknote className="h-6 w-6" />
            Élaboration du Budget Prévisionnel
          </DialogTitle>
          <DialogDescription>
            Remplissez les 7 sections pour constituer votre budget. Utilisez les onglets pour naviguer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-shrink-0 flex flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="header" className="text-xs gap-1">
                <Building2 className="h-3 w-3" /> A. Identification
              </TabsTrigger>
              <TabsTrigger value="entry" className="text-xs gap-1">
                <Settings2 className="h-3 w-3" /> B. Mode de saisie
              </TabsTrigger>
              <TabsTrigger value="grid" className="text-xs gap-1">
                <Layers className="h-3 w-3" /> C. Grille budgétaire
              </TabsTrigger>
              <TabsTrigger value="simulation" className="text-xs gap-1">
                <Calculator className="h-3 w-3" /> D. Simulation
              </TabsTrigger>
              <TabsTrigger value="comparison" className="text-xs gap-1">
                <GitCompare className="h-3 w-3" /> E. Comparaison
              </TabsTrigger>
              <TabsTrigger value="approval" className="text-xs gap-1">
                <Shield className="h-3 w-3" /> F. Approbation
              </TabsTrigger>
              <TabsTrigger value="footer" className="text-xs gap-1">
                <Save className="h-3 w-3" /> G. Actions
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 pr-2">
              {/* ═══════════════════════════════════════════════════════════════
                  SECTION A — Header & Identification
                 ═══════════════════════════════════════════════════════════════ */}
              <TabsContent value="header" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Section A — Identification du budget
                    </CardTitle>
                    <CardDescription>
                      Informations générales et paramètres du budget prévisionnel.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Name */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="lg:col-span-2">
                              <FormLabel>Nom du budget *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Budget 2026 — Version initiale"
                                  maxLength={150}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Company */}
                        <FormField
                          control={form.control}
                          name="company_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Société *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {companies.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Fiscal Year */}
                        <FormField
                          control={form.control}
                          name="fiscal_year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exercice fiscal *</FormLabel>
                              <Select
                                onValueChange={(v) => field.onChange(parseInt(v, 10))}
                                value={String(field.value)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Start Date */}
                        <FormField
                          control={form.control}
                          name="start_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date de début *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* End Date (computed) */}
                        <div className="space-y-2">
                          <Label>Date de fin (calculée)</Label>
                          <Input type="date" value={endDate} readOnly disabled className="bg-muted" />
                        </div>

                        {/* Currency */}
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Devise</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(CURRENCY_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Version (auto) */}
                        <div className="space-y-2">
                          <Label>Version (auto)</Label>
                          <Input value={form.watch('version')} readOnly disabled className="bg-muted" />
                        </div>

                        {/* Status */}
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statut</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Budget Type */}
                        <FormField
                          control={form.control}
                          name="budget_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type de budget</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Scope */}
                        <FormField
                          control={form.control}
                          name="scope"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Périmètre</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(SCOPE_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Responsible */}
                        <FormField
                          control={form.control}
                          name="responsible_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Responsable *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      <span className="flex items-center gap-2">
                                        <User className="h-3 w-3" /> {u.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Notes */}
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem className="lg:col-span-3">
                              <FormLabel>Notes & hypothèses générales</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Hypothèses macro-économiques, taux d'occupation cible, etc."
                                  maxLength={1000}
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <div className="text-xs text-muted-foreground text-right">
                                {field.value?.length ?? 0} / 1000
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION B — Entry Mode
                 ═══════════════════════════════════════════════════════════════ */}
              <TabsContent value="entry" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      Section B — Mode de saisie
                    </CardTitle>
                    <CardDescription>
                      Choisissez comment alimenter les lignes budgétaires.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Toggle buttons */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {([
                        { mode: 'manual' as EntryMode, label: 'Saisie manuelle', icon: <Layers className="h-5 w-5" /> },
                        { mode: 'import' as EntryMode, label: 'Import Excel', icon: <FileSpreadsheet className="h-5 w-5" /> },
                        { mode: 'duplicate' as EntryMode, label: 'Dupliquer', icon: <GitCompare className="h-5 w-5" /> },
                        { mode: 'rolling' as EntryMode, label: 'Budget glissant', icon: <CalendarDays className="h-5 w-5" /> },
                      ]).map(({ mode, label, icon }) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={entryMode === mode ? 'default' : 'outline'}
                          className="h-20 flex-col gap-2"
                          onClick={() => setEntryMode(mode)}
                        >
                          {icon}
                          <span className="text-xs">{label}</span>
                        </Button>
                      ))}
                    </div>

                    <Separator />

                    {/* Import panel */}
                    {entryMode === 'import' && (
                      <BudgetImport onImport={() => {}} />
                    )}

                    {/* Duplicate panel */}
                    {entryMode === 'duplicate' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Budget source à dupliquer</Label>
                          <Select value={duplicateSourceId} onValueChange={setDuplicateSourceId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un budget existant..." />
                            </SelectTrigger>
                            <SelectContent>
                              {budgetsList.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name} ({b.fiscal_year})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label>Révision globale par catégorie (%)</Label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                              { key: 'revenue', label: 'Revenus' },
                              { key: 'opex', label: 'Charges exploit.' },
                              { key: 'financial', label: 'Charges fin.' },
                              { key: 'capex', label: 'CAPEX' },
                              { key: 'loan_repayment', label: 'Remboursements' },
                            ].map(({ key, label }) => (
                              <div key={key} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">{label}</Label>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    step={0.5}
                                    className="h-8"
                                    value={duplicateRevisionPct[key] ?? 0}
                                    onChange={(e) =>
                                      setDuplicateRevisionPct((p) => ({ ...p, [key]: Number(e.target.value) }))
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => {
                            // Mock: apply revision to current lines
                            setBudgetLines((prev) =>
                              prev.map((group) => {
                                const pct = (duplicateRevisionPct[group.category] ?? 0) / 100;
                                const newChildren = group.children?.map((child) => {
                                  const newMonths = child.months.map((v) => Math.round(v * (1 + pct)));
                                  return {
                                    ...child,
                                    months: newMonths,
                                    annual_total: newMonths.reduce((s, v) => s + v, 0),
                                  };
                                });
                                const parentMonths = Array(12).fill(0);
                                newChildren?.forEach((c) => c.months.forEach((v, i) => { parentMonths[i] += v; }));
                                return {
                                  ...group,
                                  children: newChildren,
                                  months: parentMonths,
                                  annual_total: parentMonths.reduce((s, v) => s + v, 0),
                                };
                              })
                            );
                          }}
                        >
                          <GitCompare className="mr-2 h-4 w-4" />
                          Appliquer la duplication
                        </Button>
                      </div>
                    )}

                    {/* Rolling panel */}
                    {entryMode === 'rolling' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Horizon glissant</Label>
                          <Select
                            value={String(rollingHorizon)}
                            onValueChange={(v) => setRollingHorizon(Number(v) as 12 | 18 | 24)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12 mois</SelectItem>
                              <SelectItem value="18">18 mois</SelectItem>
                              <SelectItem value="24">24 mois</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Le budget glissant sera recalculé chaque mois en ajoutant un nouveau mois
                          et en retirant le mois écoulé. Horizon sélectionné : {rollingHorizon} mois.
                        </p>
                      </div>
                    )}

                    {/* Manual: just info */}
                    {entryMode === 'manual' && (
                      <p className="text-sm text-muted-foreground">
                        En mode saisie manuelle, vous renseignez directement les montants dans la grille
                        budgétaire (Section C). Vous pouvez utiliser les règles de distribution pour
                        répartir un montant annuel sur les 12 mois.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION C — Budget Grid (the big one)
                 ═══════════════════════════════════════════════════════════════ */}
              <TabsContent value="grid" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Section C — Grille budgétaire
                    </CardTitle>
                    <CardDescription>
                      23 postes budgétaires répartis en 5 catégories. Montants en FCFA (centimes stockés).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Cost center toggle */}
                    <div className="flex flex-wrap items-center gap-6 p-3 rounded-md border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={costCenterConfig.enabled}
                          onCheckedChange={(checked) =>
                            setCostCenterConfig((p) => ({ ...p, enabled: checked }))
                          }
                        />
                        <Label className="text-sm">Ventilation par centre de coûts</Label>
                      </div>
                      {costCenterConfig.enabled && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Centres :</Label>
                            <div className="flex gap-1">
                              {costCenters.map((center) => (
                                <Badge
                                  key={center}
                                  variant={costCenterConfig.centers.includes(center) ? 'default' : 'outline'}
                                  className="cursor-pointer text-xs"
                                  onClick={() =>
                                    setCostCenterConfig((p) => ({
                                      ...p,
                                      centers: p.centers.includes(center)
                                        ? p.centers.filter((c) => c !== center)
                                        : [...p.centers, center],
                                    }))
                                  }
                                >
                                  {center}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Clé :</Label>
                            <Select
                              value={costCenterConfig.allocation_key}
                              onValueChange={(v) =>
                                setCostCenterConfig((p) => ({
                                  ...p,
                                  allocation_key: v as CostCenterConfig['allocation_key'],
                                }))
                              }
                            >
                              <SelectTrigger className="h-7 w-40 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="surface">Surface (m²)</SelectItem>
                                <SelectItem value="rent_prorata">Prorata loyer</SelectItem>
                                <SelectItem value="manual">Manuelle</SelectItem>
                                <SelectItem value="auto">Automatique</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Budget grid table */}
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[250px] sticky left-0 bg-background z-10">Poste budgétaire</TableHead>
                            <TableHead className="min-w-[150px]">Contrepartie</TableHead>
                            {costCenterConfig.enabled && (
                              <TableHead className="min-w-[120px]">Centre coûts</TableHead>
                            )}
                            <TableHead className="min-w-[120px]">Hypothèse</TableHead>
                            <TableHead className="min-w-[100px] text-right">Budget N-1</TableHead>
                            <TableHead className="min-w-[70px] text-right">Var %</TableHead>
                            <TableHead className="min-w-[110px] text-right font-bold">Total annuel</TableHead>
                            {MONTH_LABELS.map((m) => (
                              <TableHead key={m} className="min-w-[100px] text-right">{m}</TableHead>
                            ))}
                            <TableHead className="min-w-[110px]">Distribution</TableHead>
                            <TableHead className="w-[60px]" />
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {budgetLines.map((group) => {
                            const isCollapsed = collapsedNodes.has(group.id);

                            return (
                              <BudgetGroupRows
                                key={group.id}
                                group={group}
                                isCollapsed={isCollapsed}
                                onToggle={() => toggleNode(group.id)}
                                onUpdateMonth={updateLineMonth}
                                onUpdateField={updateLineField}
                                onAddSubLine={addSubLine}
                                onRemoveSubLine={removeSubLine}
                                onApplyDistribution={applyDistributionToLine}
                                costCenterEnabled={costCenterConfig.enabled}
                                counterpartiesList={counterpartiesList}
                                costCenters={costCenters}
                              />
                            );
                          })}
                        </TableBody>

                        <TableFooter>
                          <TableRow className="font-bold text-base">
                            <TableCell className="sticky left-0 bg-muted z-10">
                              SOLDE NET DE TRÉSORERIE
                            </TableCell>
                            <TableCell />
                            {costCenterConfig.enabled && <TableCell />}
                            <TableCell />
                            <TableCell className="text-right">
                              {formatFCFADisplay(
                                budgetLines
                                  .filter((g) => g.level === 1 && g.category === 'revenue')
                                  .reduce((s, g) => s + (g.budget_n1 ?? 0), 0) -
                                budgetLines
                                  .filter((g) => g.level === 1 && g.category !== 'revenue')
                                  .reduce((s, g) => s + (g.budget_n1 ?? 0), 0)
                              )}
                            </TableCell>
                            <TableCell />
                            <TableCell className={cn(
                              'text-right',
                              baseTotals.net >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {formatFCFADisplay(baseTotals.net)}
                            </TableCell>
                            {Array.from({ length: 12 }, (_, i) => {
                              const monthNet = budgetLines
                                .filter((g) => g.level === 1 && g.category === 'revenue')
                                .reduce((s, g) => s + g.months[i], 0) -
                                budgetLines
                                  .filter((g) => g.level === 1 && g.category !== 'revenue')
                                  .reduce((s, g) => s + g.months[i], 0);
                              return (
                                <TableCell key={i} className={cn(
                                  'text-right',
                                  monthNet >= 0 ? 'text-green-600' : 'text-red-600'
                                )}>
                                  {formatFCFADisplay(monthNet)}
                                </TableCell>
                              );
                            })}
                            <TableCell />
                            <TableCell />
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION D — What-If Simulation
                 ═══════════════════════════════════════════════════════════════ */}
              <TabsContent value="simulation" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Section D — Simulation What-If
                    </CardTitle>
                    <CardDescription>
                      Ajustez les paramètres pour simuler l'impact sur le budget.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-8 lg:grid-cols-2">
                      {/* Parameters */}
                      <div className="space-y-5">
                        <h3 className="font-semibold text-sm">Paramètres de simulation</h3>

                        <div className="space-y-2">
                          <Label>Taux d'occupation (%)</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={simulation.occupancy_rate}
                              onChange={(e) =>
                                setSimulation((p) => ({ ...p, occupancy_rate: Number(e.target.value) }))
                              }
                              className="w-24"
                            />
                            <div className="flex-1 h-2 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary transition-all"
                                style={{ width: `${simulation.occupancy_rate}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {simulation.occupancy_rate}%
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Variation moyenne des loyers (%)</Label>
                          <Input
                            type="number"
                            step={0.5}
                            value={simulation.avg_rent_variation}
                            onChange={(e) =>
                              setSimulation((p) => ({ ...p, avg_rent_variation: Number(e.target.value) }))
                            }
                            className="w-32"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Variation coûts énergie (%)</Label>
                          <Input
                            type="number"
                            step={0.5}
                            value={simulation.energy_variation}
                            onChange={(e) =>
                              setSimulation((p) => ({ ...p, energy_variation: Number(e.target.value) }))
                            }
                            className="w-32"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Effectif (nombre d'employés)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={500}
                            value={simulation.headcount}
                            onChange={(e) =>
                              setSimulation((p) => ({ ...p, headcount: Number(e.target.value) }))
                            }
                            className="w-32"
                          />
                        </div>
                      </div>

                      {/* Results */}
                      <div className="space-y-5">
                        <h3 className="font-semibold text-sm">Résultats de la simulation</h3>

                        <div className="grid grid-cols-2 gap-4">
                          <Card className="p-4">
                            <p className="text-xs text-muted-foreground">Total revenus simulés</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatFCFACompact(simulationResult.total_revenues)} FCFA
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Base: {formatFCFACompact(baseTotals.revenues)} FCFA
                            </p>
                          </Card>

                          <Card className="p-4">
                            <p className="text-xs text-muted-foreground">Total charges simulées</p>
                            <p className="text-lg font-bold text-red-600">
                              {formatFCFACompact(simulationResult.total_charges)} FCFA
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Base: {formatFCFACompact(baseTotals.charges)} FCFA
                            </p>
                          </Card>

                          <Card className={cn(
                            'p-4',
                            simulationResult.net_cash_flow >= 0 ? 'border-green-200' : 'border-red-200'
                          )}>
                            <p className="text-xs text-muted-foreground">Flux net de trésorerie</p>
                            <p className={cn(
                              'text-lg font-bold',
                              simulationResult.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {formatFCFACompact(simulationResult.net_cash_flow)} FCFA
                            </p>
                          </Card>

                          <Card className="p-4">
                            <p className="text-xs text-muted-foreground">Mois de point mort</p>
                            <p className="text-lg font-bold">
                              {simulationResult.break_even_month
                                ? MONTH_LABELS[simulationResult.break_even_month - 1]
                                : 'Aucun'}
                            </p>
                          </Card>
                        </div>

                        {/* Comparison bar */}
                        <div className="space-y-2 mt-4">
                          <Label className="text-xs">Comparaison avec la version de base</Label>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs w-20">Revenus</span>
                              <div className="flex-1 h-5 rounded bg-muted overflow-hidden relative">
                                <div
                                  className="h-full bg-green-500/70 absolute left-0"
                                  style={{
                                    width: `${Math.min(100, (baseTotals.revenues / (simulationResult.total_revenues || 1)) * 100)}%`,
                                  }}
                                />
                                <div
                                  className="h-full bg-green-500 absolute left-0"
                                  style={{
                                    width: `${Math.min(100, (simulationResult.total_revenues / (Math.max(baseTotals.revenues, simulationResult.total_revenues) || 1)) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className={cn(
                                'text-xs w-16 text-right',
                                simulationResult.total_revenues >= baseTotals.revenues ? 'text-green-600' : 'text-red-600'
                              )}>
                                {baseTotals.revenues > 0
                                  ? `${((simulationResult.total_revenues - baseTotals.revenues) / baseTotals.revenues * 100).toFixed(1)}%`
                                  : '--'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs w-20">Charges</span>
                              <div className="flex-1 h-5 rounded bg-muted overflow-hidden relative">
                                <div
                                  className="h-full bg-red-500 absolute left-0"
                                  style={{
                                    width: `${Math.min(100, (simulationResult.total_charges / (Math.max(baseTotals.charges, simulationResult.total_charges) || 1)) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className={cn(
                                'text-xs w-16 text-right',
                                simulationResult.total_charges <= baseTotals.charges ? 'text-green-600' : 'text-red-600'
                              )}>
                                {baseTotals.charges > 0
                                  ? `${((simulationResult.total_charges - baseTotals.charges) / baseTotals.charges * 100).toFixed(1)}%`
                                  : '--'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION E — Comparison View
                 ═══════════════════════════════════════════════════════════════ */}
              <TabsContent value="comparison" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitCompare className="h-5 w-5" />
                      Section E — Vue comparative
                    </CardTitle>
                    <CardDescription>
                      Comparez le budget en cours avec des références historiques.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Toggle buttons */}
                    <div className="flex gap-2">
                      {([
                        { mode: 'simple' as ComparisonView, label: 'Vue simple' },
                        { mode: 'n_vs_n1' as ComparisonView, label: 'Comparer N vs N-1' },
                        { mode: 'budget_vs_actual' as ComparisonView, label: 'Budget vs Réalisé YTD' },
                      ]).map(({ mode, label }) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={comparisonView === mode ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setComparisonView(mode)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px]">Poste</TableHead>
                            <TableHead className="text-right min-w-[120px]">Budget N</TableHead>
                            {comparisonView !== 'simple' && (
                              <>
                                <TableHead className="text-right min-w-[120px]">
                                  {comparisonView === 'n_vs_n1' ? 'Budget N-1' : 'Réalisé YTD'}
                                </TableHead>
                                <TableHead className="text-right min-w-[100px]">Écart</TableHead>
                                <TableHead className="text-right min-w-[80px]">Écart %</TableHead>
                                {comparisonView === 'budget_vs_actual' && (
                                  <TableHead className="text-right min-w-[120px]">Projeté fin année</TableHead>
                                )}
                              </>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {budgetLines.map((group) => {
                            const n1 = group.budget_n1 ?? 0;
                            // Mock YTD = 3 months of data (25% of N-1)
                            const ytd = Math.round(n1 * 0.25 * (0.95 + Math.random() * 0.1));
                            const projected = Math.round(ytd * 4);
                            const variance = comparisonView === 'n_vs_n1'
                              ? group.annual_total - n1
                              : group.annual_total - projected;
                            const variancePct = (comparisonView === 'n_vs_n1' ? n1 : projected) > 0
                              ? (variance / (comparisonView === 'n_vs_n1' ? n1 : projected)) * 100
                              : 0;

                            return (
                              <TableRow
                                key={group.id}
                                className={cn('font-semibold', CATEGORY_COLORS[group.category])}
                              >
                                <TableCell>{group.label}</TableCell>
                                <TableCell className="text-right">{formatFCFADisplay(group.annual_total)}</TableCell>
                                {comparisonView !== 'simple' && (
                                  <>
                                    <TableCell className="text-right">
                                      {formatFCFADisplay(comparisonView === 'n_vs_n1' ? n1 : ytd)}
                                    </TableCell>
                                    <TableCell className={cn(
                                      'text-right',
                                      variance >= 0
                                        ? group.category === 'revenue' ? 'text-green-600' : 'text-red-600'
                                        : group.category === 'revenue' ? 'text-red-600' : 'text-green-600'
                                    )}>
                                      {formatFCFADisplay(variance)}
                                    </TableCell>
                                    <TableCell className={cn(
                                      'text-right',
                                      variance >= 0
                                        ? group.category === 'revenue' ? 'text-green-600' : 'text-red-600'
                                        : group.category === 'revenue' ? 'text-red-600' : 'text-green-600'
                                    )}>
                                      {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
                                    </TableCell>
                                    {comparisonView === 'budget_vs_actual' && (
                                      <TableCell className="text-right">{formatFCFADisplay(projected)}</TableCell>
                                    )}
                                  </>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <TableFooter>
                          <TableRow className="font-bold">
                            <TableCell>SOLDE NET</TableCell>
                            <TableCell className={cn(
                              'text-right',
                              baseTotals.net >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {formatFCFADisplay(baseTotals.net)}
                            </TableCell>
                            {comparisonView !== 'simple' && (
                              <>
                                <TableCell />
                                <TableCell />
                                <TableCell />
                                {comparisonView === 'budget_vs_actual' && <TableCell />}
                              </>
                            )}
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION F — Approval Workflow
                 ═══════════════════════════════════════════════════════════════ */}
              <TabsContent value="approval" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Section F — Circuit d'approbation
                    </CardTitle>
                    <CardDescription>
                      5 étapes de validation du budget : Saisie - Revue DAF - DGA - DG - Activation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Visual stepper */}
                    <div className="flex items-center justify-between gap-2 overflow-x-auto py-4">
                      {approvalSteps.map((step, idx) => {
                        const config = APPROVAL_STATUS_CONFIG[step.status];
                        const isLast = idx === approvalSteps.length - 1;

                        return (
                          <div key={step.step} className="flex items-center flex-shrink-0">
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center border-2',
                                step.status === 'approved' && 'bg-green-100 border-green-500 text-green-700',
                                step.status === 'rejected' && 'bg-red-100 border-red-500 text-red-700',
                                step.status === 'pending' && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                                step.status === 'skipped' && 'bg-muted border-dashed text-muted-foreground',
                              )}>
                                {step.status === 'approved' && <Check className="h-5 w-5" />}
                                {step.status === 'rejected' && <X className="h-5 w-5" />}
                                {step.status === 'pending' && <Clock className="h-5 w-5" />}
                                {step.status === 'skipped' && <span className="text-xs">-</span>}
                              </div>
                              <span className="text-xs font-medium text-center max-w-[80px]">{step.role}</span>
                              <Badge variant={config.variant} className="text-[10px]">
                                {config.label}
                              </Badge>
                            </div>
                            {!isLast && (
                              <div className={cn(
                                'w-12 h-0.5 mx-1',
                                approvalSteps[idx + 1]?.status === 'approved' || step.status === 'approved'
                                  ? 'bg-green-500'
                                  : 'bg-muted-foreground/20'
                              )} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    {/* Step details */}
                    <div className="space-y-4">
                      {approvalSteps.map((step, idx) => {
                        const config = APPROVAL_STATUS_CONFIG[step.status];
                        return (
                          <div
                            key={step.step}
                            className={cn(
                              'rounded-md border p-4 space-y-2',
                              step.status === 'approved' && 'border-green-200 bg-green-50/50 dark:bg-green-950/10',
                              step.status === 'rejected' && 'border-red-200 bg-red-50/50 dark:bg-red-950/10',
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold">Étape {step.step}</span>
                                <Badge variant={config.variant}>{config.label}</Badge>
                                <span className="text-sm text-muted-foreground">{step.role}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {step.actor_name}
                                {step.date && (
                                  <span className="flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {step.date}
                                  </span>
                                )}
                                <span>Délai: {step.deadline_days}j</span>
                              </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-1">
                              {step.comment && step.status !== 'pending' && (
                                <p className="text-sm italic text-muted-foreground">
                                  « {step.comment} »
                                </p>
                              )}
                              {step.status === 'pending' && (
                                <Textarea
                                  placeholder="Ajouter un commentaire..."
                                  className="h-16 text-sm"
                                  value={step.comment ?? ''}
                                  onChange={(e) => updateApprovalComment(idx, e.target.value)}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══════════════════════════════════════════════════════════════
                  SECTION G — Footer / Actions
                 ═══════════════════════════════════════════════════════════════ */}
              <TabsContent value="footer" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Section G — Actions
                    </CardTitle>
                    <CardDescription>
                      Enregistrez, soumettez ou exportez votre budget.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4">
                        <p className="text-xs text-muted-foreground">Total revenus</p>
                        <p className="text-lg font-bold text-green-600">{formatFCFACompact(baseTotals.revenues)} FCFA</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-xs text-muted-foreground">Total charges</p>
                        <p className="text-lg font-bold text-red-600">{formatFCFACompact(baseTotals.charges)} FCFA</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-xs text-muted-foreground">Solde net</p>
                        <p className={cn('text-lg font-bold', baseTotals.net >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {formatFCFACompact(baseTotals.net)} FCFA
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-xs text-muted-foreground">Lignes budgétaires</p>
                        <p className="text-lg font-bold">
                          {budgetLines.reduce((s, g) => s + (g.children?.length ?? 0), 0)}
                        </p>
                      </Card>
                    </div>

                    <Separator className="my-4" />

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="default"
                        onClick={handleSaveDraft}
                        disabled={isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? 'Enregistrement...' : 'Enregistrer brouillon'}
                      </Button>

                      <Button
                        type="button"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleSubmitForApproval}
                        disabled={isPending}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Soumettre pour approbation
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Mock export
                          alert('Export Excel en cours de génération...');
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Exporter Excel
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          alert('Export PDF en cours de génération...');
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Exporter PDF
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveSection('comparison')}
                      >
                        <GitCompare className="mr-2 h-4 w-4" />
                        Comparer
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Budget Group Rows (sub-component for Section C) ─────────────────────────

interface BudgetGroupRowsProps {
  group: BudgetLine;
  isCollapsed: boolean;
  onToggle: () => void;
  onUpdateMonth: (lineId: string, monthIndex: number, value: number) => void;
  onUpdateField: (lineId: string, field: string, value: string) => void;
  onAddSubLine: (parentId: string, category: BudgetCategory) => void;
  onRemoveSubLine: (parentId: string, childId: string) => void;
  onApplyDistribution: (lineId: string, rule: DistributionRuleType) => void;
  costCenterEnabled: boolean;
  counterpartiesList: Array<{ id: string; name: string }>;
  costCenters: string[];
}

function BudgetGroupRows({
  group,
  isCollapsed,
  onToggle,
  onUpdateMonth,
  onUpdateField,
  onAddSubLine,
  onRemoveSubLine,
  onApplyDistribution,
  costCenterEnabled,
  counterpartiesList,
  costCenters,
}: BudgetGroupRowsProps) {
  const varianceColor = (v: number | undefined) => {
    if (!v) return '';
    return v >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <>
      {/* Parent row */}
      <TableRow className={cn('font-bold', CATEGORY_COLORS[group.category])}>
        <TableCell className="sticky left-0 z-10" style={{ backgroundColor: 'inherit' }}>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggle}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <span className="text-sm">{group.label}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1"
              title="Ajouter une sous-ligne"
              onClick={() => onAddSubLine(group.id, group.category)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell />
        {costCenterEnabled && <TableCell />}
        <TableCell />
        <TableCell className="text-right text-xs">
          {group.budget_n1 ? formatFCFADisplay(group.budget_n1) : '-'}
        </TableCell>
        <TableCell className={cn('text-right text-xs', varianceColor(group.variance_n1))}>
          {group.variance_n1 !== undefined ? `${group.variance_n1 > 0 ? '+' : ''}${group.variance_n1.toFixed(1)}%` : '-'}
        </TableCell>
        <TableCell className="text-right font-bold">
          {formatFCFADisplay(group.annual_total)}
        </TableCell>
        {group.months.map((v, i) => (
          <TableCell key={i} className="text-right font-bold text-xs">
            {formatFCFADisplay(v)}
          </TableCell>
        ))}
        <TableCell />
        <TableCell />
      </TableRow>

      {/* Child rows */}
      {!isCollapsed && group.children?.map((child) => (
        <TableRow key={child.id} className={cn('hover:bg-accent/50', CATEGORY_COLORS[child.category] + '/50')}>
          <TableCell className="sticky left-0 z-10 bg-background">
            <div className="flex items-center gap-1 pl-8">
              <span className="text-xs text-muted-foreground font-mono">{child.code}</span>
              <Input
                value={child.label}
                onChange={(e) => onUpdateField(child.id, 'label', e.target.value)}
                className="h-7 text-xs border-none shadow-none bg-transparent px-1"
                placeholder="Libellé..."
              />
            </div>
          </TableCell>
          <TableCell>
            <Select
              value={child.counterparty_id ?? ''}
              onValueChange={(v) => onUpdateField(child.id, 'counterparty_id', v)}
            >
              <SelectTrigger className="h-7 text-xs border-none shadow-none">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucune</SelectItem>
                {counterpartiesList.map((cp) => (
                  <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableCell>
          {costCenterEnabled && (
            <TableCell>
              <Select
                value={child.cost_center ?? ''}
                onValueChange={(v) => onUpdateField(child.id, 'cost_center', v)}
              >
                <SelectTrigger className="h-7 text-xs border-none shadow-none">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          )}
          <TableCell>
            <Input
              value={child.hypothesis}
              onChange={(e) => onUpdateField(child.id, 'hypothesis', e.target.value)}
              className="h-7 text-xs border-none shadow-none bg-transparent px-1"
              placeholder="Hypothèse..."
            />
          </TableCell>
          <TableCell className="text-right text-xs text-muted-foreground">
            {child.budget_n1 ? formatFCFADisplay(child.budget_n1) : '-'}
          </TableCell>
          <TableCell className={cn('text-right text-xs', varianceColor(child.variance_n1))}>
            {child.variance_n1 !== undefined && child.variance_n1 !== 0
              ? `${child.variance_n1 > 0 ? '+' : ''}${child.variance_n1.toFixed(1)}%`
              : '-'}
          </TableCell>
          <TableCell className="text-right font-medium text-xs">
            {formatFCFADisplay(child.annual_total)}
          </TableCell>
          {child.months.map((v, mi) => (
            <TableCell key={mi}>
              <MonthInput
                value={v}
                onChange={(newVal) => onUpdateMonth(child.id, mi, newVal)}
              />
            </TableCell>
          ))}
          <TableCell>
            <Select
              value={child.distribution_rule}
              onValueChange={(v) => onApplyDistribution(child.id, v as DistributionRuleType)}
            >
              <SelectTrigger className="h-7 text-xs border-none shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DISTRIBUTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onRemoveSubLine(group.id, child.id)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Month Input (FCFA formatted) ────────────────────────────────────────────

interface MonthInputProps {
  value: number;
  onChange: (value: number) => void;
}

function MonthInput({ value, onChange }: MonthInputProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleFocus = () => {
    setEditing(true);
    setEditValue(String(Math.round(value / 100)));
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseInt(editValue.replace(/\s/g, ''), 10);
    if (!isNaN(parsed)) {
      onChange(parsed * 100);
    }
  };

  return (
    <Input
      className="h-7 text-xs text-right w-[90px] px-1"
      value={editing ? editValue : formatFCFA(value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => setEditValue(e.target.value)}
    />
  );
}

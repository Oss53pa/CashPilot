import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/config/supabase";
import {
  Banknote,
  Building2,
  Settings2,
  Layers,
  Calculator,
  GitCompare,
  Shield,
  Save,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "../types";
import { budgetService } from "../services/budget.service";

import { BudgetFormHeader } from "./budget-form-header";
import { BudgetFormEntryMode } from "./budget-form-entry-mode";
import { BudgetFormGridSection } from "./budget-form-grid-section";
import { BudgetFormSimulation } from "./budget-form-simulation";
import { BudgetFormComparisonSection } from "./budget-form-comparison-section";
import { BudgetFormApproval } from "./budget-form-approval";
import { BudgetFormFooter } from "./budget-form-footer";
import { computeEndDate } from "./budget-form-utils";

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetHeaderInput) => void;
  isPending?: boolean;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BudgetForm({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: BudgetFormProps) {
  const currentYear = new Date().getFullYear();

  // ─── Reference data queries ────────────────────────────────────────────
  const { data: companies = [] } = useQuery({
    queryKey: ["ref", "companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: users = [] } = useQuery({
    queryKey: ["ref", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      if (error) throw error;
      return (data ?? []).map(
        (u: { id: string; full_name: string | null }) => ({
          id: u.id,
          name: u.full_name ?? "",
        }),
      );
    },
  });
  const { data: costCenters = [] } = useQuery({
    queryKey: ["ref", "cost_centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("name")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((c: { name: string }) => c.name);
    },
  });
  const { data: budgetsList = [] } = useQuery({
    queryKey: ["ref", "budgets_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("id, name, fiscal_year")
        .order("fiscal_year", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: counterpartiesList = [] } = useQuery({
    queryKey: ["ref", "counterparties_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counterparties")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Form state ──────────────────────────────────────────────────────────

  const form = useForm<BudgetHeaderInput>({
    resolver: zodResolver(budgetHeaderSchema),
    defaultValues: {
      name: "",
      company_id: "",
      fiscal_year: currentYear,
      start_date: `${currentYear}-01-01`,
      end_date: `${currentYear}-12-31`,
      currency: "XOF",
      version: "V1",
      status: "draft",
      budget_type: "annual_fixed",
      scope: "company",
      responsible_id: "",
      notes: "",
    },
  });

  // ─── Section states ──────────────────────────────────────────────────────

  const [activeSection, setActiveSection] = useState("header");
  const [entryMode, setEntryMode] = useState<EntryMode>("manual");
  const [rollingHorizon, setRollingHorizon] = useState<12 | 18 | 24>(12);
  const [duplicateSourceId, setDuplicateSourceId] = useState("");
  const [duplicateRevisionPct, setDuplicateRevisionPct] = useState<
    Record<string, number>
  >({
    revenue: 0,
    opex: 0,
    financial: 0,
    capex: 0,
    loan_repayment: 0,
  });

  // Budget lines
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Cost center
  const [costCenterConfig, setCostCenterConfig] = useState<CostCenterConfig>({
    enabled: false,
    centers: [],
    allocation_key: "manual",
  });

  // Simulation
  const [simulation, setSimulation] = useState<BudgetSimulation>({
    occupancy_rate: 95,
    avg_rent_variation: 3,
    energy_variation: 5,
    headcount: 12,
  });

  // Comparison
  const [comparisonView, setComparisonView] =
    useState<ComparisonView>("simple");

  // Approval
  const [approvalSteps, setApprovalSteps] = useState<BudgetApprovalStep[]>([]);

  // ─── Computed values ─────────────────────────────────────────────────────

  const startDate = form.watch("start_date");
  const endDate = useMemo(() => computeEndDate(startDate), [startDate]);

  // Update end_date when start_date changes
  useMemo(() => {
    if (endDate) form.setValue("end_date", endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate]);

  // Simulation results
  const simulationResult: SimulationResult = useMemo(
    () => budgetService.simulateBudget(budgetLines, simulation),
    [budgetLines, simulation],
  );

  // Base totals
  const baseTotals = useMemo(() => {
    let revenues = 0;
    let charges = 0;
    for (const line of budgetLines) {
      if (line.level !== 1) continue;
      if (line.category === "revenue") revenues = line.annual_total;
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

  const updateLineMonth = useCallback(
    (lineId: string, monthIndex: number, value: number) => {
      setBudgetLines((prev) => {
        const updated = prev.map((group) => {
          if (group.id === lineId) {
            const newMonths = [...group.months];
            newMonths[monthIndex] = value;
            return {
              ...group,
              months: newMonths,
              annual_total: newMonths.reduce((s, v) => s + v, 0),
            };
          }
          if (group.children) {
            const newChildren = group.children.map((child) => {
              if (child.id === lineId) {
                const newMonths = [...child.months];
                newMonths[monthIndex] = value;
                return {
                  ...child,
                  months: newMonths,
                  annual_total: newMonths.reduce((s, v) => s + v, 0),
                };
              }
              return child;
            });
            // Recompute parent
            const parentMonths = Array(12).fill(0);
            newChildren.forEach((c) =>
              c.months.forEach((v, i) => {
                parentMonths[i] += v;
              }),
            );
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
    },
    [],
  );

  const updateLineField = useCallback(
    (lineId: string, field: string, value: string) => {
      setBudgetLines((prev) =>
        prev.map((group) => {
          if (group.id === lineId) return { ...group, [field]: value };
          if (group.children) {
            return {
              ...group,
              children: group.children.map((child) =>
                child.id === lineId ? { ...child, [field]: value } : child,
              ),
            };
          }
          return group;
        }),
      );
    },
    [],
  );

  const addSubLine = useCallback(
    (parentId: string, category: BudgetCategory) => {
      setBudgetLines((prev) =>
        prev.map((group) => {
          if (group.id === parentId) {
            const newChild: BudgetLine = {
              id: `line-new-${Date.now()}`,
              budget_id: "new-budget",
              parent_id: parentId,
              level: 2,
              code: `${category.toUpperCase()}-NEW`,
              label: "",
              category,
              hypothesis: "",
              annual_total: 0,
              months: Array(12).fill(0),
              distribution_rule: "manual",
            };
            return {
              ...group,
              children: [...(group.children ?? []), newChild],
            };
          }
          return group;
        }),
      );
    },
    [],
  );

  const removeSubLine = useCallback((parentId: string, childId: string) => {
    setBudgetLines((prev) =>
      prev.map((group) => {
        if (group.id === parentId && group.children) {
          const newChildren = group.children.filter((c) => c.id !== childId);
          const parentMonths = Array(12).fill(0);
          newChildren.forEach((c) =>
            c.months.forEach((v, i) => {
              parentMonths[i] += v;
            }),
          );
          return {
            ...group,
            children: newChildren,
            months: parentMonths,
            annual_total: parentMonths.reduce((s, v) => s + v, 0),
          };
        }
        return group;
      }),
    );
  }, []);

  const applyDistributionToLine = useCallback(
    (lineId: string, rule: DistributionRuleType) => {
      setBudgetLines((prev) =>
        prev.map((group) => {
          if (group.children) {
            const newChildren = group.children.map((child) => {
              if (child.id !== lineId) return child;
              const total = child.annual_total;
              let newMonths: number[];
              if (rule === "equal") {
                const monthly = Math.round(total / 12);
                newMonths = Array(12).fill(monthly);
              } else if (rule === "seasonal") {
                const weights = [7, 7, 8, 8, 9, 9, 7, 6, 9, 10, 10, 10];
                const totalW = weights.reduce((s, w) => s + w, 0);
                newMonths = weights.map((w) =>
                  Math.round((total * w) / totalW),
                );
              } else if (rule === "progressive") {
                const rate = 0.03;
                const base = total / (12 + (12 * 11 * rate) / 2);
                newMonths = Array.from({ length: 12 }, (_, i) =>
                  Math.round(base * (1 + rate * i)),
                );
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
            newChildren.forEach((c) =>
              c.months.forEach((v, i) => {
                parentMonths[i] += v;
              }),
            );
            return {
              ...group,
              children: newChildren,
              months: parentMonths,
              annual_total: parentMonths.reduce((s, v) => s + v, 0),
            };
          }
          return group;
        }),
      );
    },
    [],
  );

  const handleSaveDraft = useCallback(() => {
    const values = form.getValues();
    onSubmit({ ...values, status: "draft" });
  }, [form, onSubmit]);

  const handleSubmitForApproval = useCallback(async () => {
    const values = form.getValues();
    onSubmit({ ...values, status: "in_review" });
  }, [form, onSubmit]);

  const updateApprovalComment = useCallback(
    (stepIndex: number, comment: string) => {
      setApprovalSteps((prev) =>
        prev.map((s, i) => (i === stepIndex ? { ...s, comment } : s)),
      );
    },
    [],
  );

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
            Remplissez les 7 sections pour constituer votre budget. Utilisez les
            onglets pour naviguer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs
            value={activeSection}
            onValueChange={setActiveSection}
            className="flex-1 flex flex-col overflow-hidden"
          >
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
              <TabsContent value="header" className="mt-0">
                <BudgetFormHeader
                  form={form}
                  companies={companies}
                  users={users}
                  currentYear={currentYear}
                  endDate={endDate}
                />
              </TabsContent>

              <TabsContent value="entry" className="mt-0">
                <BudgetFormEntryMode
                  entryMode={entryMode}
                  setEntryMode={setEntryMode}
                  rollingHorizon={rollingHorizon}
                  setRollingHorizon={setRollingHorizon}
                  duplicateSourceId={duplicateSourceId}
                  setDuplicateSourceId={setDuplicateSourceId}
                  duplicateRevisionPct={duplicateRevisionPct}
                  setDuplicateRevisionPct={setDuplicateRevisionPct}
                  budgetsList={budgetsList}
                  setBudgetLines={setBudgetLines}
                />
              </TabsContent>

              <TabsContent value="grid" className="mt-0">
                <BudgetFormGridSection
                  budgetLines={budgetLines}
                  collapsedNodes={collapsedNodes}
                  costCenterConfig={costCenterConfig}
                  setCostCenterConfig={setCostCenterConfig}
                  costCenters={costCenters}
                  counterpartiesList={counterpartiesList}
                  baseTotals={baseTotals}
                  onToggleNode={toggleNode}
                  onUpdateMonth={updateLineMonth}
                  onUpdateField={updateLineField}
                  onAddSubLine={addSubLine}
                  onRemoveSubLine={removeSubLine}
                  onApplyDistribution={applyDistributionToLine}
                />
              </TabsContent>

              <TabsContent value="simulation" className="mt-0">
                <BudgetFormSimulation
                  simulation={simulation}
                  setSimulation={setSimulation}
                  simulationResult={simulationResult}
                  baseTotals={baseTotals}
                />
              </TabsContent>

              <TabsContent value="comparison" className="mt-0">
                <BudgetFormComparisonSection
                  budgetLines={budgetLines}
                  comparisonView={comparisonView}
                  setComparisonView={setComparisonView}
                  baseTotals={baseTotals}
                />
              </TabsContent>

              <TabsContent value="approval" className="mt-0">
                <BudgetFormApproval
                  approvalSteps={approvalSteps}
                  onUpdateApprovalComment={updateApprovalComment}
                />
              </TabsContent>

              <TabsContent value="footer" className="mt-0">
                <BudgetFormFooter
                  baseTotals={baseTotals}
                  budgetLines={budgetLines}
                  isPending={isPending}
                  onSaveDraft={handleSaveDraft}
                  onSubmitForApproval={handleSubmitForApproval}
                  onNavigateComparison={() => setActiveSection("comparison")}
                  onClose={() => onOpenChange(false)}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

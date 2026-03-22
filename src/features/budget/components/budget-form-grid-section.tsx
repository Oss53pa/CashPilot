import { Layers } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  BudgetLine,
  BudgetCategory,
  DistributionRuleType,
  CostCenterConfig,
} from "../types";
import { MONTH_LABELS, formatFCFADisplay } from "./budget-form-utils";
import { BudgetGroupRows } from "./budget-form-group-rows";

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetFormGridSectionProps {
  budgetLines: BudgetLine[];
  collapsedNodes: Set<string>;
  costCenterConfig: CostCenterConfig;
  setCostCenterConfig: React.Dispatch<React.SetStateAction<CostCenterConfig>>;
  costCenters: string[];
  counterpartiesList: Array<{ id: string; name: string }>;
  baseTotals: { revenues: number; charges: number; net: number };
  onToggleNode: (id: string) => void;
  onUpdateMonth: (lineId: string, monthIndex: number, value: number) => void;
  onUpdateField: (lineId: string, field: string, value: string) => void;
  onAddSubLine: (parentId: string, category: BudgetCategory) => void;
  onRemoveSubLine: (parentId: string, childId: string) => void;
  onApplyDistribution: (lineId: string, rule: DistributionRuleType) => void;
}

// ─── Section C — Budget Grid ────────────────────────────────────────────────

export function BudgetFormGridSection({
  budgetLines,
  collapsedNodes,
  costCenterConfig,
  setCostCenterConfig,
  costCenters,
  counterpartiesList,
  baseTotals,
  onToggleNode,
  onUpdateMonth,
  onUpdateField,
  onAddSubLine,
  onRemoveSubLine,
  onApplyDistribution,
}: BudgetFormGridSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Section C — Grille budgétaire
        </CardTitle>
        <CardDescription>
          23 postes budgétaires répartis en 5 catégories. Montants en FCFA
          (centimes stockés).
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
                <Label className="text-xs text-muted-foreground">
                  Centres :
                </Label>
                <div className="flex gap-1">
                  {costCenters.map((center) => (
                    <Badge
                      key={center}
                      variant={
                        costCenterConfig.centers.includes(center)
                          ? "default"
                          : "outline"
                      }
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
                      allocation_key: v as CostCenterConfig["allocation_key"],
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
                <TableHead className="min-w-[250px] sticky left-0 bg-background z-10">
                  Poste budgétaire
                </TableHead>
                <TableHead className="min-w-[150px]">Contrepartie</TableHead>
                {costCenterConfig.enabled && (
                  <TableHead className="min-w-[120px]">Centre coûts</TableHead>
                )}
                <TableHead className="min-w-[120px]">Hypothèse</TableHead>
                <TableHead className="min-w-[100px] text-right">
                  Budget N-1
                </TableHead>
                <TableHead className="min-w-[70px] text-right">Var %</TableHead>
                <TableHead className="min-w-[110px] text-right font-bold">
                  Total annuel
                </TableHead>
                {MONTH_LABELS.map((m) => (
                  <TableHead key={m} className="min-w-[100px] text-right">
                    {m}
                  </TableHead>
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
                    onToggle={() => onToggleNode(group.id)}
                    onUpdateMonth={onUpdateMonth}
                    onUpdateField={onUpdateField}
                    onAddSubLine={onAddSubLine}
                    onRemoveSubLine={onRemoveSubLine}
                    onApplyDistribution={onApplyDistribution}
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
                      .filter((g) => g.level === 1 && g.category === "revenue")
                      .reduce((s, g) => s + (g.budget_n1 ?? 0), 0) -
                      budgetLines
                        .filter(
                          (g) => g.level === 1 && g.category !== "revenue",
                        )
                        .reduce((s, g) => s + (g.budget_n1 ?? 0), 0),
                  )}
                </TableCell>
                <TableCell />
                <TableCell
                  className={cn(
                    "text-right",
                    baseTotals.net >= 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  {formatFCFADisplay(baseTotals.net)}
                </TableCell>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNet =
                    budgetLines
                      .filter((g) => g.level === 1 && g.category === "revenue")
                      .reduce((s, g) => s + g.months[i], 0) -
                    budgetLines
                      .filter((g) => g.level === 1 && g.category !== "revenue")
                      .reduce((s, g) => s + g.months[i], 0);
                  return (
                    <TableCell
                      key={i}
                      className={cn(
                        "text-right",
                        monthNet >= 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
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
  );
}

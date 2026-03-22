import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  BudgetLine,
  BudgetCategory,
  DistributionRuleType,
} from "../types";
import {
  CATEGORY_COLORS,
  DISTRIBUTION_LABELS,
  formatFCFADisplay,
} from "./budget-form-utils";
import { MonthInput } from "./budget-form-month-input";

// ─── Budget Group Rows (sub-component for Section C) ─────────────────────────

export interface BudgetGroupRowsProps {
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

export function BudgetGroupRows({
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
    if (!v) return "";
    return v >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <>
      {/* Parent row */}
      <TableRow className={cn("font-bold", CATEGORY_COLORS[group.category])}>
        <TableCell
          className="sticky left-0 z-10"
          style={{ backgroundColor: "inherit" }}
        >
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggle}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
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
          {group.budget_n1 ? formatFCFADisplay(group.budget_n1) : "-"}
        </TableCell>
        <TableCell
          className={cn("text-right text-xs", varianceColor(group.variance_n1))}
        >
          {group.variance_n1 !== undefined
            ? `${group.variance_n1 > 0 ? "+" : ""}${group.variance_n1.toFixed(1)}%`
            : "-"}
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
      {!isCollapsed &&
        group.children?.map((child) => (
          <TableRow
            key={child.id}
            className={cn(
              "hover:bg-accent/50",
              CATEGORY_COLORS[child.category] + "/50",
            )}
          >
            <TableCell className="sticky left-0 z-10 bg-background">
              <div className="flex items-center gap-1 pl-8">
                <span className="text-xs text-muted-foreground font-mono">
                  {child.code}
                </span>
                <Input
                  value={child.label}
                  onChange={(e) =>
                    onUpdateField(child.id, "label", e.target.value)
                  }
                  className="h-7 text-xs border-none shadow-none bg-transparent px-1"
                  placeholder="Libellé..."
                />
              </div>
            </TableCell>
            <TableCell>
              <Select
                value={child.counterparty_id ?? ""}
                onValueChange={(v) =>
                  onUpdateField(child.id, "counterparty_id", v)
                }
              >
                <SelectTrigger className="h-7 text-xs border-none shadow-none">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {counterpartiesList.map((cp) => (
                    <SelectItem key={cp.id} value={cp.id}>
                      {cp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            {costCenterEnabled && (
              <TableCell>
                <Select
                  value={child.cost_center ?? ""}
                  onValueChange={(v) =>
                    onUpdateField(child.id, "cost_center", v)
                  }
                >
                  <SelectTrigger className="h-7 text-xs border-none shadow-none">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc} value={cc}>
                        {cc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            )}
            <TableCell>
              <Input
                value={child.hypothesis}
                onChange={(e) =>
                  onUpdateField(child.id, "hypothesis", e.target.value)
                }
                className="h-7 text-xs border-none shadow-none bg-transparent px-1"
                placeholder="Hypothèse..."
              />
            </TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {child.budget_n1 ? formatFCFADisplay(child.budget_n1) : "-"}
            </TableCell>
            <TableCell
              className={cn(
                "text-right text-xs",
                varianceColor(child.variance_n1),
              )}
            >
              {child.variance_n1 !== undefined && child.variance_n1 !== 0
                ? `${child.variance_n1 > 0 ? "+" : ""}${child.variance_n1.toFixed(1)}%`
                : "-"}
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
                onValueChange={(v) =>
                  onApplyDistribution(child.id, v as DistributionRuleType)
                }
              >
                <SelectTrigger className="h-7 text-xs border-none shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DISTRIBUTION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
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

import { GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { BudgetLine, ComparisonView } from "../types";
import {
  CATEGORY_COLORS,
  formatFCFADisplay,
  type BaseTotals,
} from "./budget-form-utils";

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetFormComparisonSectionProps {
  budgetLines: BudgetLine[];
  comparisonView: ComparisonView;
  setComparisonView: (view: ComparisonView) => void;
  baseTotals: BaseTotals;
}

// ─── Section E — Comparison View ────────────────────────────────────────────

export function BudgetFormComparisonSection({
  budgetLines,
  comparisonView,
  setComparisonView,
  baseTotals,
}: BudgetFormComparisonSectionProps) {
  return (
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
          {[
            { mode: "simple" as ComparisonView, label: "Vue simple" },
            { mode: "n_vs_n1" as ComparisonView, label: "Comparer N vs N-1" },
            {
              mode: "budget_vs_actual" as ComparisonView,
              label: "Budget vs Réalisé YTD",
            },
          ].map(({ mode, label }) => (
            <Button
              key={mode}
              type="button"
              variant={comparisonView === mode ? "default" : "outline"}
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
                <TableHead className="text-right min-w-[120px]">
                  Budget N
                </TableHead>
                {comparisonView !== "simple" && (
                  <>
                    <TableHead className="text-right min-w-[120px]">
                      {comparisonView === "n_vs_n1"
                        ? "Budget N-1"
                        : "Réalisé YTD"}
                    </TableHead>
                    <TableHead className="text-right min-w-[100px]">
                      Écart
                    </TableHead>
                    <TableHead className="text-right min-w-[80px]">
                      Écart %
                    </TableHead>
                    {comparisonView === "budget_vs_actual" && (
                      <TableHead className="text-right min-w-[120px]">
                        Projeté fin année
                      </TableHead>
                    )}
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetLines.map((group) => {
                const n1 = group.budget_n1 ?? 0;
                // Mock YTD = 3 months of data (25% of N-1)
                const ytd = Math.round(
                  n1 * 0.25 * (0.95 + Math.random() * 0.1),
                );
                const projected = Math.round(ytd * 4);
                const variance =
                  comparisonView === "n_vs_n1"
                    ? group.annual_total - n1
                    : group.annual_total - projected;
                const variancePct =
                  (comparisonView === "n_vs_n1" ? n1 : projected) > 0
                    ? (variance /
                        (comparisonView === "n_vs_n1" ? n1 : projected)) *
                      100
                    : 0;

                return (
                  <TableRow
                    key={group.id}
                    className={cn(
                      "font-semibold",
                      CATEGORY_COLORS[group.category],
                    )}
                  >
                    <TableCell>{group.label}</TableCell>
                    <TableCell className="text-right">
                      {formatFCFADisplay(group.annual_total)}
                    </TableCell>
                    {comparisonView !== "simple" && (
                      <>
                        <TableCell className="text-right">
                          {formatFCFADisplay(
                            comparisonView === "n_vs_n1" ? n1 : ytd,
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right",
                            variance >= 0
                              ? group.category === "revenue"
                                ? "text-green-600"
                                : "text-red-600"
                              : group.category === "revenue"
                                ? "text-red-600"
                                : "text-green-600",
                          )}
                        >
                          {formatFCFADisplay(variance)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right",
                            variance >= 0
                              ? group.category === "revenue"
                                ? "text-green-600"
                                : "text-red-600"
                              : group.category === "revenue"
                                ? "text-red-600"
                                : "text-green-600",
                          )}
                        >
                          {variancePct > 0 ? "+" : ""}
                          {variancePct.toFixed(1)}%
                        </TableCell>
                        {comparisonView === "budget_vs_actual" && (
                          <TableCell className="text-right">
                            {formatFCFADisplay(projected)}
                          </TableCell>
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
                <TableCell
                  className={cn(
                    "text-right",
                    baseTotals.net >= 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  {formatFCFADisplay(baseTotals.net)}
                </TableCell>
                {comparisonView !== "simple" && (
                  <>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                    {comparisonView === "budget_vs_actual" && <TableCell />}
                  </>
                )}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

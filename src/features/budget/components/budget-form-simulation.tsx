import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BudgetSimulation, SimulationResult } from "../types";
import {
  MONTH_LABELS,
  formatFCFACompact,
  type BaseTotals,
} from "./budget-form-utils";

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetFormSimulationProps {
  simulation: BudgetSimulation;
  setSimulation: React.Dispatch<React.SetStateAction<BudgetSimulation>>;
  simulationResult: SimulationResult;
  baseTotals: BaseTotals;
}

// ─── Section D — What-If Simulation ─────────────────────────────────────────

export function BudgetFormSimulation({
  simulation,
  setSimulation,
  simulationResult,
  baseTotals,
}: BudgetFormSimulationProps) {
  return (
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
                    setSimulation((p) => ({
                      ...p,
                      occupancy_rate: Number(e.target.value),
                    }))
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
                  setSimulation((p) => ({
                    ...p,
                    avg_rent_variation: Number(e.target.value),
                  }))
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
                  setSimulation((p) => ({
                    ...p,
                    energy_variation: Number(e.target.value),
                  }))
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
                  setSimulation((p) => ({
                    ...p,
                    headcount: Number(e.target.value),
                  }))
                }
                className="w-32"
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-5">
            <h3 className="font-semibold text-sm">
              Résultats de la simulation
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">
                  Total revenus simulés
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatFCFACompact(simulationResult.total_revenues)} FCFA
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base: {formatFCFACompact(baseTotals.revenues)} FCFA
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs text-muted-foreground">
                  Total charges simulées
                </p>
                <p className="text-lg font-bold text-red-600">
                  {formatFCFACompact(simulationResult.total_charges)} FCFA
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Base: {formatFCFACompact(baseTotals.charges)} FCFA
                </p>
              </Card>

              <Card
                className={cn(
                  "p-4",
                  simulationResult.net_cash_flow >= 0
                    ? "border-green-200"
                    : "border-red-200",
                )}
              >
                <p className="text-xs text-muted-foreground">
                  Flux net de trésorerie
                </p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    simulationResult.net_cash_flow >= 0
                      ? "text-green-600"
                      : "text-red-600",
                  )}
                >
                  {formatFCFACompact(simulationResult.net_cash_flow)} FCFA
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-xs text-muted-foreground">
                  Mois de point mort
                </p>
                <p className="text-lg font-bold">
                  {simulationResult.break_even_month
                    ? MONTH_LABELS[simulationResult.break_even_month - 1]
                    : "Aucun"}
                </p>
              </Card>
            </div>

            {/* Comparison bar */}
            <div className="space-y-2 mt-4">
              <Label className="text-xs">
                Comparaison avec la version de base
              </Label>
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
                  <span
                    className={cn(
                      "text-xs w-16 text-right",
                      simulationResult.total_revenues >= baseTotals.revenues
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {baseTotals.revenues > 0
                      ? `${(((simulationResult.total_revenues - baseTotals.revenues) / baseTotals.revenues) * 100).toFixed(1)}%`
                      : "--"}
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
                  <span
                    className={cn(
                      "text-xs w-16 text-right",
                      simulationResult.total_charges <= baseTotals.charges
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {baseTotals.charges > 0
                      ? `${(((simulationResult.total_charges - baseTotals.charges) / baseTotals.charges) * 100).toFixed(1)}%`
                      : "--"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

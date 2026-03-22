import {
  FileSpreadsheet,
  GitCompare,
  CalendarDays,
  Layers,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import type { EntryMode, BudgetLine } from "../types";
import { BudgetImport } from "./budget-import";

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetFormEntryModeProps {
  entryMode: EntryMode;
  setEntryMode: (mode: EntryMode) => void;
  rollingHorizon: 12 | 18 | 24;
  setRollingHorizon: (h: 12 | 18 | 24) => void;
  duplicateSourceId: string;
  setDuplicateSourceId: (id: string) => void;
  duplicateRevisionPct: Record<string, number>;
  setDuplicateRevisionPct: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  budgetsList: Array<{ id: string; name: string; fiscal_year: number }>;
  setBudgetLines: React.Dispatch<React.SetStateAction<BudgetLine[]>>;
}

// ─── Section B — Entry Mode ─────────────────────────────────────────────────

export function BudgetFormEntryMode({
  entryMode,
  setEntryMode,
  rollingHorizon,
  setRollingHorizon,
  duplicateSourceId,
  setDuplicateSourceId,
  duplicateRevisionPct,
  setDuplicateRevisionPct,
  budgetsList,
  setBudgetLines,
}: BudgetFormEntryModeProps) {
  return (
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
          {[
            {
              mode: "manual" as EntryMode,
              label: "Saisie manuelle",
              icon: <Layers className="h-5 w-5" />,
            },
            {
              mode: "import" as EntryMode,
              label: "Import Excel",
              icon: <FileSpreadsheet className="h-5 w-5" />,
            },
            {
              mode: "duplicate" as EntryMode,
              label: "Dupliquer",
              icon: <GitCompare className="h-5 w-5" />,
            },
            {
              mode: "rolling" as EntryMode,
              label: "Budget glissant",
              icon: <CalendarDays className="h-5 w-5" />,
            },
          ].map(({ mode, label, icon }) => (
            <Button
              key={mode}
              type="button"
              variant={entryMode === mode ? "default" : "outline"}
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
        {entryMode === "import" && <BudgetImport onImport={() => {}} />}

        {/* Duplicate panel */}
        {entryMode === "duplicate" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Budget source à dupliquer</Label>
              <Select
                value={duplicateSourceId}
                onValueChange={setDuplicateSourceId}
              >
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
                  { key: "revenue", label: "Revenus" },
                  { key: "opex", label: "Charges exploit." },
                  { key: "financial", label: "Charges fin." },
                  { key: "capex", label: "CAPEX" },
                  { key: "loan_repayment", label: "Remboursements" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step={0.5}
                        className="h-8"
                        value={duplicateRevisionPct[key] ?? 0}
                        onChange={(e) =>
                          setDuplicateRevisionPct((p) => ({
                            ...p,
                            [key]: Number(e.target.value),
                          }))
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
                    const pct =
                      (duplicateRevisionPct[group.category] ?? 0) / 100;
                    const newChildren = group.children?.map((child) => {
                      const newMonths = child.months.map((v) =>
                        Math.round(v * (1 + pct)),
                      );
                      return {
                        ...child,
                        months: newMonths,
                        annual_total: newMonths.reduce((s, v) => s + v, 0),
                      };
                    });
                    const parentMonths = Array(12).fill(0);
                    newChildren?.forEach((c) =>
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
                  }),
                );
              }}
            >
              <GitCompare className="mr-2 h-4 w-4" />
              Appliquer la duplication
            </Button>
          </div>
        )}

        {/* Rolling panel */}
        {entryMode === "rolling" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Horizon glissant</Label>
              <Select
                value={String(rollingHorizon)}
                onValueChange={(v) =>
                  setRollingHorizon(Number(v) as 12 | 18 | 24)
                }
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
              Le budget glissant sera recalculé chaque mois en ajoutant un
              nouveau mois et en retirant le mois écoulé. Horizon sélectionné :{" "}
              {rollingHorizon} mois.
            </p>
          </div>
        )}

        {/* Manual: just info */}
        {entryMode === "manual" && (
          <p className="text-sm text-muted-foreground">
            En mode saisie manuelle, vous renseignez directement les montants
            dans la grille budgétaire (Section C). Vous pouvez utiliser les
            règles de distribution pour répartir un montant annuel sur les 12
            mois.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

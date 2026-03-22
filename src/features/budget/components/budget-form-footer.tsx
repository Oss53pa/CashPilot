import { Save, Send, Download, GitCompare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BudgetLine } from "../types";
import { formatFCFACompact, type BaseTotals } from "./budget-form-utils";

// ─── Props ───────────────────────────────────────────────────────────────────

interface BudgetFormFooterProps {
  baseTotals: BaseTotals;
  budgetLines: BudgetLine[];
  isPending?: boolean;
  onSaveDraft: () => void;
  onSubmitForApproval: () => void;
  onNavigateComparison: () => void;
  onClose: () => void;
}

// ─── Section G — Footer / Actions ───────────────────────────────────────────

export function BudgetFormFooter({
  baseTotals,
  budgetLines,
  isPending,
  onSaveDraft,
  onSubmitForApproval,
  onNavigateComparison,
  onClose,
}: BudgetFormFooterProps) {
  return (
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
            <p className="text-lg font-bold text-green-600">
              {formatFCFACompact(baseTotals.revenues)} FCFA
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total charges</p>
            <p className="text-lg font-bold text-red-600">
              {formatFCFACompact(baseTotals.charges)} FCFA
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Solde net</p>
            <p
              className={cn(
                "text-lg font-bold",
                baseTotals.net >= 0 ? "text-green-600" : "text-red-600",
              )}
            >
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
            onClick={onSaveDraft}
            disabled={isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Enregistrement..." : "Enregistrer brouillon"}
          </Button>

          <Button
            type="button"
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={onSubmitForApproval}
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
              alert("Export Excel en cours de génération...");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter Excel
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              alert("Export PDF en cours de génération...");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onNavigateComparison}
          >
            <GitCompare className="mr-2 h-4 w-4" />
            Comparer
          </Button>

          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

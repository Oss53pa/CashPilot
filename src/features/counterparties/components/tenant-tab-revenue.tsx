import { BarChart3, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeclaredRevenue } from "../types";
import { formatFrancs } from "@/utils/currency";
import { formatDate, DECLARED_STATUS_LABELS } from "./tenant-form-utils";

interface TabDeclaredRevenueProps {
  revenues: DeclaredRevenue[];
  hasVariableRent: boolean;
}

export function TabDeclaredRevenue({
  revenues,
  hasVariableRent,
}: TabDeclaredRevenueProps) {
  if (!hasVariableRent) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>
            Onglet non applicable : ce bail ne comporte pas de loyer variable.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Chiffre d'affaires declare ({revenues.length} periodes)
        </h3>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Ajouter declaration
        </Button>
      </div>

      {/* Placeholder chart area */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Graphique d'evolution du CA (a venir)</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">CA declare (FCFA)</TableHead>
                <TableHead className="text-right">CA verifie (FCFA)</TableHead>
                <TableHead className="text-right">Loyer variable du</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date declaration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenues.map((r) => (
                <TableRow key={r.period}>
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell className="text-right">
                    {formatFrancs(r.declared_ca)}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.verified_ca ? formatFrancs(r.verified_ca) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatFrancs(r.variable_rent_due)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "verified"
                          ? "success"
                          : r.status === "audited"
                            ? "secondary"
                            : "warning"
                      }
                    >
                      {DECLARED_STATUS_LABELS[r.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(r.declaration_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

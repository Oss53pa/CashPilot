import { AlertTriangle, ChevronRight, Banknote, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenantDispute } from "../types";
import { formatFrancs } from "@/utils/currency";
import {
  ReadonlyField,
  formatDate,
  DISPUTE_STATUS_LABELS,
} from "./tenant-form-utils";

interface TabDisputesProps {
  disputes: TenantDispute[];
}

export function TabDisputes({ disputes }: TabDisputesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Dossiers contentieux ({disputes.length})
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <ChevronRight className="mr-1.5 h-3.5 w-3.5" />
            Voir module Contentieux
          </Button>
          <Button size="sm" variant="outline">
            <Banknote className="mr-1.5 h-3.5 w-3.5" />
            Generer mise en demeure
          </Button>
        </div>
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Aucun dossier contentieux pour ce locataire.
          </CardContent>
        </Card>
      ) : (
        disputes.map((d) => (
          <Card key={d.id} className="border-destructive/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {d.ref} - {d.type}
                </CardTitle>
                <Badge
                  variant={
                    d.status === "open" || d.status === "in_progress"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {DISPUTE_STATUS_LABELS[d.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ReadonlyField
                  label="Date ouverture"
                  value={formatDate(d.opened_date)}
                />
                <ReadonlyField
                  label="Montant reclame"
                  value={formatFrancs(d.amount_claimed)}
                />
                <ReadonlyField label="Avocat" value={d.lawyer ?? "-"} />
                <ReadonlyField
                  label="Prochaine audience"
                  value={
                    d.next_hearing_date ? formatDate(d.next_hearing_date) : "-"
                  }
                />
                {d.resolution_date && (
                  <ReadonlyField
                    label="Date resolution"
                    value={formatDate(d.resolution_date)}
                  />
                )}
                {d.resolution_amount != null && (
                  <ReadonlyField
                    label="Montant resolution"
                    value={formatFrancs(d.resolution_amount)}
                  />
                )}
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{d.description}</p>
              </div>
              {d.notes && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{d.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

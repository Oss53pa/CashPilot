import { useState } from "react";
import { Hammer, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TenantWork } from "../types";
import { formatFrancs } from "@/utils/currency";
import {
  Field,
  formatDate,
  WORK_STATUS_LABELS,
  WORK_STATUS_VARIANTS,
} from "./tenant-form-utils";

interface TabWorksProps {
  works: TenantWork[];
}

export function TabWorks({ works }: TabWorksProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Travaux locataire ({works.length})
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nouvelle demande
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Nouvelle demande de travaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Date de demande">
                <Input type="date" />
              </Field>
              <Field label="Cout estime (FCFA)">
                <Input type="number" />
              </Field>
              <Field
                label="Description"
                className="sm:col-span-2 lg:col-span-3"
              >
                <Textarea
                  rows={2}
                  placeholder="Nature des travaux demandes..."
                />
              </Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm font-medium">Remise en etat requise</p>
                <Switch />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={() => setShowAddForm(false)}>
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {works.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Hammer className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Aucune demande de travaux enregistree.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Cout estime</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Remise en etat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.ref}</TableCell>
                    <TableCell>{formatDate(w.request_date)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {w.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {w.estimated_cost ? formatFrancs(w.estimated_cost) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={WORK_STATUS_VARIANTS[w.status]}>
                        {WORK_STATUS_LABELS[w.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {w.start_date && (
                        <span>Debut: {formatDate(w.start_date)}</span>
                      )}
                      {w.actual_end_date && (
                        <span className="block">
                          Fin: {formatDate(w.actual_end_date)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {w.restoration_required ? (
                        <Badge variant="warning">Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

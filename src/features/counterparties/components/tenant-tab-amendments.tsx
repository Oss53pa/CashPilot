import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { LeaseAmendment } from "../types";
import { formatFrancs } from "@/utils/currency";
import { Field, formatDate } from "./tenant-form-utils";

interface TabAmendmentsProps {
  amendments: LeaseAmendment[];
}

export function TabAmendments({ amendments }: TabAmendmentsProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Historique des avenants ({amendments.length})
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nouvel avenant
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Nouvel avenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Date de signature">
                <Input type="date" />
              </Field>
              <Field label="Date d'effet">
                <Input type="date" />
              </Field>
              <Field label="Type de modification">
                <Input placeholder="Extension, revision loyer..." />
              </Field>
              <Field label="Nouveau loyer (FCFA)">
                <Input type="number" />
              </Field>
              <Field label="Nouvelle surface (m2)">
                <Input type="number" />
              </Field>
              <Field label="Nouvelle echeance">
                <Input type="date" />
              </Field>
              <Field
                label="Description"
                className="sm:col-span-2 lg:col-span-3"
              >
                <Textarea
                  rows={2}
                  placeholder="Description de la modification..."
                />
              </Field>
              <Field label="Signe par (locataire)">
                <Input />
              </Field>
              <Field label="Signe par (bailleur)">
                <Input />
              </Field>
              <Field label="Valide par">
                <Input />
              </Field>
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
                Enregistrer avenant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {amendments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun avenant enregistre pour ce bail.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N</TableHead>
                  <TableHead>Date signature</TableHead>
                  <TableHead>Date effet</TableHead>
                  <TableHead>Modifications</TableHead>
                  <TableHead>Nouveau loyer</TableHead>
                  <TableHead>Nouvelle surface</TableHead>
                  <TableHead>Valide par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amendments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.amendment_number}
                    </TableCell>
                    <TableCell>{formatDate(a.signature_date)}</TableCell>
                    <TableCell>{formatDate(a.effective_date)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.modification_types.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.new_rent ? formatFrancs(a.new_rent) : "-"}
                    </TableCell>
                    <TableCell>
                      {a.new_area ? `${a.new_area} m2` : "-"}
                    </TableCell>
                    <TableCell>{a.validated_by ?? "-"}</TableCell>
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

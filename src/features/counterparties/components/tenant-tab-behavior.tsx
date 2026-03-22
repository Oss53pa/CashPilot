import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Counterparty } from "@/types/database";
import type {
  InstallmentPlan,
  PaymentProfile,
  LeaseContract,
  ColdStartProfile,
} from "../types";
import { formatFrancs } from "@/utils/currency";
import { PaymentProfileCard } from "./payment-profile-card";
import {
  Field,
  formatDate,
  INSTALLMENT_STATUS_LABELS,
} from "./tenant-form-utils";

interface TabBehaviorProps {
  counterparty: Counterparty;
  paymentProfile: PaymentProfile | undefined;
  lease: LeaseContract | undefined;
  coldStart: ColdStartProfile | undefined;
  isLoading: boolean;
  onUpdateOverrides: (o: {
    forced_delay?: number | null;
    probability_override?: number | null;
    risk_note?: string | null;
  }) => void;
  installmentPlans: InstallmentPlan[];
}

export function TabBehavior({
  counterparty,
  paymentProfile,
  lease,
  coldStart,
  isLoading,
  onUpdateOverrides,
  installmentPlans,
}: TabBehaviorProps) {
  const [showPlanForm, setShowPlanForm] = useState(false);

  return (
    <div className="space-y-6">
      <PaymentProfileCard
        counterparty={counterparty}
        profile={paymentProfile}
        lease={lease}
        coldStart={coldStart}
        isLoading={isLoading}
        onUpdateOverrides={onUpdateOverrides}
      />

      <Separator />

      {/* Installment Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Plans d'echelonnement</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPlanForm(!showPlanForm)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nouveau plan
          </Button>
        </div>

        {showPlanForm && (
          <Card className="mb-4 border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Nouveau plan d'echelonnement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Date debut">
                  <Input type="date" />
                </Field>
                <Field label="Date fin">
                  <Input type="date" />
                </Field>
                <Field label="Dette totale (FCFA)">
                  <Input type="number" />
                </Field>
                <Field label="Mensualite (FCFA)">
                  <Input type="number" />
                </Field>
                <Field label="Nombre d'echeances">
                  <Input type="number" />
                </Field>
                <Field label="Notes" className="sm:col-span-2 lg:col-span-3">
                  <Textarea rows={2} />
                </Field>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPlanForm(false)}
                >
                  Annuler
                </Button>
                <Button size="sm" onClick={() => setShowPlanForm(false)}>
                  Creer plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {installmentPlans.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              Aucun plan d'echelonnement actif.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Dette totale</TableHead>
                    <TableHead className="text-right">Mensualite</TableHead>
                    <TableHead>Avancement</TableHead>
                    <TableHead className="text-right">Solde restant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentPlans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.plan_ref}
                      </TableCell>
                      <TableCell>
                        {formatDate(p.start_date)} - {formatDate(p.end_date)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatFrancs(p.total_debt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatFrancs(p.monthly_payment)}
                      </TableCell>
                      <TableCell>
                        {p.paid_installments}/{p.nb_installments}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatFrancs(p.remaining_balance)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "active"
                              ? "default"
                              : p.status === "completed"
                                ? "success"
                                : "destructive"
                          }
                        >
                          {INSTALLMENT_STATUS_LABELS[p.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

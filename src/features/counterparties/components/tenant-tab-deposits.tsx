import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DepositGuarantee } from "../types";
import { Field, ReadonlyField } from "./tenant-form-utils";

interface TabDepositsProps {
  data: DepositGuarantee | undefined;
  onUpdate: <K extends keyof DepositGuarantee>(
    key: K,
    value: DepositGuarantee[K],
  ) => void;
}

export function TabDeposits({ data, onUpdate }: TabDepositsProps) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Cash Deposit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Depot de garantie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Montant recu (FCFA)">
              <Input
                type="number"
                value={data.cash_deposit_received ?? ""}
                onChange={(e) =>
                  onUpdate(
                    "cash_deposit_received",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </Field>
            <Field label="Date de depot">
              <Input
                type="date"
                value={data.deposit_date ?? ""}
                onChange={(e) =>
                  onUpdate("deposit_date", e.target.value || undefined)
                }
              />
            </Field>
            <ReadonlyField
              label="Equivalent mois"
              value={
                data.months_equivalent ? `${data.months_equivalent} mois` : "-"
              }
            />
            <Field label="Compte de depot">
              <Input
                value={data.holding_account ?? ""}
                onChange={(e) =>
                  onUpdate("holding_account", e.target.value || undefined)
                }
              />
            </Field>
            <Field label="Date restitution prevue">
              <Input
                type="date"
                value={data.restitution_date ?? ""}
                onChange={(e) =>
                  onUpdate("restitution_date", e.target.value || undefined)
                }
              />
            </Field>
            <Field
              label="Conditions de restitution"
              className="sm:col-span-2 lg:col-span-3"
            >
              <Textarea
                value={data.restitution_conditions ?? ""}
                onChange={(e) =>
                  onUpdate(
                    "restitution_conditions",
                    e.target.value || undefined,
                  )
                }
                rows={2}
              />
            </Field>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deduction estimee (FCFA)">
              <Input
                type="number"
                value={data.estimated_deduction ?? ""}
                onChange={(e) =>
                  onUpdate(
                    "estimated_deduction",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </Field>
            <Field label="Motif deduction">
              <Input
                value={data.deduction_reason ?? ""}
                onChange={(e) =>
                  onUpdate("deduction_reason", e.target.value || undefined)
                }
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Entry/Exit Inspections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Etats des lieux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Entry */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">
                Entree
              </h4>
              <Field label="Date EDL entree">
                <Input
                  type="date"
                  value={data.entry_inspection_date ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "entry_inspection_date",
                      e.target.value || undefined,
                    )
                  }
                />
              </Field>
              <Field label="Document">
                <Input
                  value={data.entry_inspection_file ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "entry_inspection_file",
                      e.target.value || undefined,
                    )
                  }
                  placeholder="Nom du fichier..."
                />
              </Field>
              <Field label="Observations">
                <Textarea
                  value={data.entry_inspection_notes ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "entry_inspection_notes",
                      e.target.value || undefined,
                    )
                  }
                  rows={2}
                />
              </Field>
            </div>
            {/* Exit */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">
                Sortie
              </h4>
              <Field label="Date EDL sortie">
                <Input
                  type="date"
                  value={data.exit_inspection_date ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "exit_inspection_date",
                      e.target.value || undefined,
                    )
                  }
                />
              </Field>
              <Field label="Document">
                <Input
                  value={data.exit_inspection_file ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "exit_inspection_file",
                      e.target.value || undefined,
                    )
                  }
                  placeholder="Nom du fichier..."
                />
              </Field>
              <Field label="Observations">
                <Textarea
                  value={data.exit_inspection_notes ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "exit_inspection_notes",
                      e.target.value || undefined,
                    )
                  }
                  rows={2}
                />
              </Field>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Degradations constatees</p>
              <Switch
                checked={data.has_damages}
                onCheckedChange={(v) => onUpdate("has_damages", v)}
              />
            </div>
            {data.has_damages && (
              <Field label="Deduction degradations (FCFA)">
                <Input
                  type="number"
                  value={data.damage_deduction ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "damage_deduction",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </Field>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Guarantee */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Garantie bancaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Garantie bancaire active</p>
              <Switch
                checked={data.has_bank_guarantee}
                onCheckedChange={(v) => onUpdate("has_bank_guarantee", v)}
              />
            </div>
          </div>

          {data.has_bank_guarantee && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Reference garantie">
                <Input
                  value={data.guarantee_ref ?? ""}
                  onChange={(e) =>
                    onUpdate("guarantee_ref", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Banque garante">
                <Input
                  value={data.guarantor_bank ?? ""}
                  onChange={(e) =>
                    onUpdate("guarantor_bank", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Montant garanti (FCFA)">
                <Input
                  type="number"
                  value={data.guarantee_amount ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "guarantee_amount",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </Field>
              <Field label="Date d'expiration">
                <Input
                  type="date"
                  value={data.guarantee_expiry ?? ""}
                  onChange={(e) =>
                    onUpdate("guarantee_expiry", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Alerte renouvellement (jours)">
                <Input
                  type="number"
                  value={data.guarantee_renewal_alert_days ?? 60}
                  onChange={(e) =>
                    onUpdate(
                      "guarantee_renewal_alert_days",
                      Number(e.target.value),
                    )
                  }
                />
              </Field>
              <Field label="Document">
                <Input
                  value={data.guarantee_document ?? ""}
                  onChange={(e) =>
                    onUpdate("guarantee_document", e.target.value || undefined)
                  }
                  placeholder="Nom du fichier..."
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

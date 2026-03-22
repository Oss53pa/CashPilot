import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  LeaseDetails,
  LeaseType,
  Periodicity,
  FullIndexationType,
} from "../types";
import {
  Field,
  ReadonlyField,
  LEASE_TYPE_LABELS,
  PERIODICITY_LABELS,
  INDEXATION_TYPE_LABELS,
} from "./tenant-form-utils";

interface TabLeaseProps {
  data: LeaseDetails | undefined;
  onUpdate: <K extends keyof LeaseDetails>(
    key: K,
    value: LeaseDetails[K],
  ) => void;
}

export function TabLease({ data, onUpdate }: TabLeaseProps) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Bail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Informations du bail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Type de bail *">
              <Select
                value={data.lease_type}
                onValueChange={(v) => onUpdate("lease_type", v as LeaseType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(LEASE_TYPE_LABELS) as [LeaseType, string][]
                  ).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reference bail *">
              <Input
                value={data.lease_ref}
                onChange={(e) => onUpdate("lease_ref", e.target.value)}
              />
            </Field>
            <Field label="Zone">
              <Input
                value={data.zone}
                onChange={(e) => onUpdate("zone", e.target.value)}
              />
            </Field>
            <Field label="N du lot *">
              <Input
                value={data.unit_number}
                onChange={(e) => onUpdate("unit_number", e.target.value)}
              />
            </Field>
            <Field label="Etage">
              <Input
                value={data.floor ?? ""}
                onChange={(e) => onUpdate("floor", e.target.value || undefined)}
              />
            </Field>
            <Field label="Surface totale (m2) *">
              <Input
                type="number"
                value={data.total_area}
                onChange={(e) => onUpdate("total_area", Number(e.target.value))}
              />
            </Field>
            <Field label="Surface de vente (m2)">
              <Input
                type="number"
                value={data.sales_area ?? ""}
                onChange={(e) =>
                  onUpdate(
                    "sales_area",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </Field>
            <Field label="Date de signature">
              <Input
                type="date"
                value={data.signature_date}
                onChange={(e) => onUpdate("signature_date", e.target.value)}
              />
            </Field>
            <Field label="Date d'effet *">
              <Input
                type="date"
                value={data.effective_date}
                onChange={(e) => onUpdate("effective_date", e.target.value)}
              />
            </Field>
            <Field label="Date d'expiration *">
              <Input
                type="date"
                value={data.expiry_date}
                onChange={(e) => onUpdate("expiry_date", e.target.value)}
              />
            </Field>
            <Field label="Duree ferme (mois)">
              <Input
                type="number"
                value={data.firm_duration}
                readOnly
                className="bg-muted"
              />
            </Field>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Option de renouvellement</p>
              <Switch
                checked={data.renewal_option}
                onCheckedChange={(v) => onUpdate("renewal_option", v)}
              />
            </div>
            {data.renewal_option && (
              <>
                <Field label="Preavis (mois)">
                  <Input
                    type="number"
                    value={data.notice_period_months ?? ""}
                    onChange={(e) =>
                      onUpdate(
                        "notice_period_months",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </Field>
                <Field label="Alerte renouvellement (jours)">
                  <Input
                    type="number"
                    value={data.renewal_alert_days ?? 90}
                    onChange={(e) =>
                      onUpdate("renewal_alert_days", Number(e.target.value))
                    }
                  />
                </Field>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loyers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Structure des loyers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Loyer mensuel HT (FCFA) *">
              <Input
                type="number"
                value={data.monthly_rent_ht}
                onChange={(e) =>
                  onUpdate("monthly_rent_ht", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Loyer au m2 (FCFA)">
              <Input
                type="number"
                value={data.rent_per_sqm}
                readOnly
                className="bg-muted"
              />
            </Field>
            <Field label="Charges mensuelles HT (FCFA) *">
              <Input
                type="number"
                value={data.monthly_charges_ht}
                onChange={(e) =>
                  onUpdate("monthly_charges_ht", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Jour d'echeance *">
              <Input
                type="number"
                min={1}
                max={28}
                value={data.payment_due_day}
                onChange={(e) =>
                  onUpdate("payment_due_day", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Periodicite *">
              <Select
                value={data.periodicity}
                onValueChange={(v) => onUpdate("periodicity", v as Periodicity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PERIODICITY_LABELS) as [
                      Periodicity,
                      string,
                    ][]
                  ).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mode de paiement">
              <Input
                value={data.payment_method ?? ""}
                onChange={(e) =>
                  onUpdate("payment_method", e.target.value || undefined)
                }
                placeholder="Virement, cheque..."
              />
            </Field>
          </div>

          <Separator className="my-4" />

          {/* Variable rent */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Loyer variable (% CA)</p>
              <Switch
                checked={data.has_variable_rent}
                onCheckedChange={(v) => onUpdate("has_variable_rent", v)}
              />
            </div>
            {data.has_variable_rent && (
              <>
                <Field label="Taux variable (%)">
                  <Input
                    type="number"
                    value={data.variable_rent_pct ?? ""}
                    onChange={(e) =>
                      onUpdate("variable_rent_pct", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="CA minimum garanti (FCFA)">
                  <Input
                    type="number"
                    value={data.guaranteed_minimum_ca ?? ""}
                    onChange={(e) =>
                      onUpdate(
                        "guaranteed_minimum_ca",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </Field>
              </>
            )}
          </div>

          <Separator className="my-4" />

          {/* Entry fee */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Pas-de-porte (FCFA)">
              <Input
                type="number"
                value={data.entry_fee ?? ""}
                onChange={(e) =>
                  onUpdate(
                    "entry_fee",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </Field>
            <Field label="Date encaissement">
              <Input
                type="date"
                value={data.entry_fee_date ?? ""}
                onChange={(e) =>
                  onUpdate("entry_fee_date", e.target.value || undefined)
                }
              />
            </Field>
          </div>

          <Separator className="my-4" />

          {/* Rent free */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Franchise de loyer</p>
              <Switch
                checked={data.has_rent_free}
                onCheckedChange={(v) => onUpdate("has_rent_free", v)}
              />
            </div>
            {data.has_rent_free && (
              <>
                <Field label="Duree franchise (mois)">
                  <Input
                    type="number"
                    value={data.rent_free_months ?? ""}
                    onChange={(e) =>
                      onUpdate("rent_free_months", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Debut franchise">
                  <Input
                    type="date"
                    value={data.rent_free_start ?? ""}
                    onChange={(e) =>
                      onUpdate("rent_free_start", e.target.value || undefined)
                    }
                  />
                </Field>
                <Field label="Fin franchise">
                  <Input
                    type="date"
                    value={data.rent_free_end ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </Field>
                <Field label="Loyer post-franchise (FCFA)">
                  <Input
                    type="number"
                    value={data.post_free_rent ?? ""}
                    onChange={(e) =>
                      onUpdate(
                        "post_free_rent",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </Field>
              </>
            )}
          </div>

          <Separator className="my-4" />

          {/* VAT */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">TVA applicable</p>
              <Switch
                checked={data.vat_applicable}
                onCheckedChange={(v) => onUpdate("vat_applicable", v)}
              />
            </div>
            {data.vat_applicable && (
              <Field label="Taux TVA (%)">
                <Input
                  type="number"
                  value={data.vat_rate ?? 18}
                  onChange={(e) => onUpdate("vat_rate", Number(e.target.value))}
                />
              </Field>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indexation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Indexation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Type d'indexation">
              <Select
                value={data.indexation_type ?? "none"}
                onValueChange={(v) =>
                  onUpdate("indexation_type", v as FullIndexationType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(INDEXATION_TYPE_LABELS) as [
                      FullIndexationType,
                      string,
                    ][]
                  ).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {data.indexation_type && data.indexation_type !== "none" && (
              <>
                <Field label="Taux (%)">
                  <Input
                    type="number"
                    value={data.indexation_rate ?? ""}
                    onChange={(e) =>
                      onUpdate("indexation_rate", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Date anniversaire">
                  <Input
                    type="date"
                    value={data.indexation_anniversary ?? ""}
                    onChange={(e) =>
                      onUpdate(
                        "indexation_anniversary",
                        e.target.value || undefined,
                      )
                    }
                  />
                </Field>
                <Field label="Prochain loyer revise (FCFA)">
                  <Input
                    type="number"
                    value={data.next_revised_rent ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </Field>
                <Field label="Plafond indexation (%)">
                  <Input
                    type="number"
                    value={data.indexation_cap ?? ""}
                    onChange={(e) =>
                      onUpdate(
                        "indexation_cap",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </Field>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Effort ratio */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ratio d'effort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReadonlyField
              label="Ratio d'effort actuel"
              value={data.effort_ratio ? `${data.effort_ratio}%` : "-"}
            />
            <Field label="Seuil d'alerte (%)">
              <Input
                type="number"
                value={data.effort_alert_threshold ?? 15}
                onChange={(e) =>
                  onUpdate("effort_alert_threshold", Number(e.target.value))
                }
              />
            </Field>
            {data.effort_ratio &&
              data.effort_alert_threshold &&
              data.effort_ratio > data.effort_alert_threshold && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Ratio d'effort eleve
                  </span>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

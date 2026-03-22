import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  TenantIdentity,
  TenantLegalForm,
  TenantStatus,
  EmployeeCount,
} from "../types";
import {
  Field,
  LEGAL_FORM_LABELS,
  STATUS_LABELS,
  EMPLOYEE_COUNT_LABELS,
  AVAILABLE_TAGS,
} from "./tenant-form-utils";

interface TabIdentityProps {
  data: TenantIdentity | undefined;
  onUpdate: <K extends keyof TenantIdentity>(
    key: K,
    value: TenantIdentity[K],
  ) => void;
  onToggleTag: (tag: string) => void;
}

export function TabIdentity({ data, onUpdate, onToggleTag }: TabIdentityProps) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Raison sociale & Identite juridique */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Identite juridique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Raison sociale *">
              <Input
                value={data.legal_name}
                onChange={(e) => onUpdate("legal_name", e.target.value)}
              />
            </Field>
            <Field label="Nom commercial *">
              <Input
                value={data.trade_name}
                onChange={(e) => onUpdate("trade_name", e.target.value)}
              />
            </Field>
            <Field label="Groupe / Enseigne">
              <Input
                value={data.brand_group ?? ""}
                onChange={(e) =>
                  onUpdate("brand_group", e.target.value || undefined)
                }
              />
            </Field>
            <Field label="Nationalite enseigne">
              <Input
                value={data.brand_nationality ?? ""}
                onChange={(e) =>
                  onUpdate("brand_nationality", e.target.value || undefined)
                }
              />
            </Field>
            <Field label="Forme juridique *">
              <Select
                value={data.legal_form}
                onValueChange={(v) =>
                  onUpdate("legal_form", v as TenantLegalForm)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(LEGAL_FORM_LABELS) as [
                      TenantLegalForm,
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
            <Field label="N RCCM">
              <Input
                value={data.rc_number ?? ""}
                onChange={(e) =>
                  onUpdate("rc_number", e.target.value || undefined)
                }
              />
            </Field>
            <Field label="N Contribuable">
              <Input
                value={data.tax_number ?? ""}
                onChange={(e) =>
                  onUpdate("tax_number", e.target.value || undefined)
                }
              />
            </Field>
            <Field label="Secteur d'activite *">
              <Input
                value={data.activity_sector}
                onChange={(e) => onUpdate("activity_sector", e.target.value)}
              />
            </Field>
            <Field label="Sous-secteur">
              <Input
                value={data.sub_sector ?? ""}
                onChange={(e) =>
                  onUpdate("sub_sector", e.target.value || undefined)
                }
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Contact principal *">
              <Input
                value={data.primary_contact_name}
                onChange={(e) =>
                  onUpdate("primary_contact_name", e.target.value)
                }
              />
            </Field>
            <Field label="Fonction">
              <Input
                value={data.primary_contact_role ?? ""}
                onChange={(e) =>
                  onUpdate("primary_contact_role", e.target.value || undefined)
                }
              />
            </Field>
            <Field label="Telephone principal *">
              <Input
                value={data.phone_primary}
                onChange={(e) => onUpdate("phone_primary", e.target.value)}
              />
            </Field>
            <Field label="Email principal *">
              <Input
                type="email"
                value={data.email_primary}
                onChange={(e) => onUpdate("email_primary", e.target.value)}
              />
            </Field>
            <Field label="Telephone secondaire">
              <Input
                value={data.phone_secondary ?? ""}
                onChange={(e) =>
                  onUpdate("phone_secondary", e.target.value || undefined)
                }
              />
            </Field>
            <Field label="Email secondaire">
              <Input
                type="email"
                value={data.email_secondary ?? ""}
                onChange={(e) =>
                  onUpdate("email_secondary", e.target.value || undefined)
                }
              />
            </Field>
            <Field
              label="Adresse siege"
              className="sm:col-span-2 lg:col-span-3"
            >
              <Textarea
                value={data.hq_address ?? ""}
                onChange={(e) =>
                  onUpdate("hq_address", e.target.value || undefined)
                }
                rows={2}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Info complementaire */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Informations complementaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Effectif">
              <Select
                value={data.employee_count ?? ""}
                onValueChange={(v) =>
                  onUpdate("employee_count", v as EmployeeCount)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(EMPLOYEE_COUNT_LABELS) as [
                      EmployeeCount,
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
            <Field label="CA annuel (FCFA)">
              <Input
                type="number"
                value={data.annual_revenue ?? ""}
                onChange={(e) =>
                  onUpdate(
                    "annual_revenue",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </Field>
            <Field label="Statut *">
              <Select
                value={data.status}
                onValueChange={(v) => onUpdate("status", v as TenantStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(STATUS_LABELS) as [TenantStatus, string][]
                  ).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Separator className="my-4" />

          {/* Tags */}
          <div>
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={data.tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onToggleTag(tag)}
                >
                  {data.tags.includes(tag) && (
                    <Check className="mr-1 h-3 w-3" />
                  )}
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Toggles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Unites multiples</p>
                <p className="text-xs text-muted-foreground">
                  Ce locataire occupe plusieurs lots
                </p>
              </div>
              <Switch
                checked={data.has_multiple_units}
                onCheckedChange={(v) => onUpdate("has_multiple_units", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Conflit d'interet</p>
                <p className="text-xs text-muted-foreground">
                  Lien avec un administrateur
                </p>
              </div>
              <Switch
                checked={data.conflict_of_interest}
                onCheckedChange={(v) => onUpdate("conflict_of_interest", v)}
              />
            </div>
          </div>

          {data.conflict_of_interest && (
            <Field label="Detail du conflit" className="mt-4">
              <Textarea
                value={data.conflict_detail ?? ""}
                onChange={(e) =>
                  onUpdate("conflict_detail", e.target.value || undefined)
                }
                rows={2}
              />
            </Field>
          )}

          <Field label="Notes internes" className="mt-4">
            <Textarea
              value={data.notes ?? ""}
              onChange={(e) => onUpdate("notes", e.target.value || undefined)}
              rows={3}
              placeholder="Observations internes sur le locataire..."
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TenantInsurance } from "../types";
import { Field } from "./tenant-form-utils";

interface TabInsuranceProps {
  data: TenantInsurance | undefined;
  onUpdate: <K extends keyof TenantInsurance>(
    key: K,
    value: TenantInsurance[K],
  ) => void;
}

export function TabInsurance({ data, onUpdate }: TabInsuranceProps) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* RC Pro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Responsabilite Civile Professionnelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Assurance RC Pro</p>
              <Switch
                checked={data.has_rc_insurance}
                onCheckedChange={(v) => onUpdate("has_rc_insurance", v)}
              />
            </div>
          </div>

          {data.has_rc_insurance && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Compagnie">
                <Input
                  value={data.rc_company ?? ""}
                  onChange={(e) =>
                    onUpdate("rc_company", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="N police">
                <Input
                  value={data.rc_policy_number ?? ""}
                  onChange={(e) =>
                    onUpdate("rc_policy_number", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Date debut">
                <Input
                  type="date"
                  value={data.rc_start_date ?? ""}
                  onChange={(e) =>
                    onUpdate("rc_start_date", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Date expiration">
                <Input
                  type="date"
                  value={data.rc_expiry_date ?? ""}
                  onChange={(e) =>
                    onUpdate("rc_expiry_date", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Couverture (FCFA)">
                <Input
                  type="number"
                  value={data.rc_coverage ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "rc_coverage",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </Field>
              <Field label="Alerte expiration (jours)">
                <Input
                  type="number"
                  value={data.rc_expiry_alert_days ?? 30}
                  onChange={(e) =>
                    onUpdate("rc_expiry_alert_days", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Attestation">
                <Input
                  value={data.rc_certificate_file ?? ""}
                  onChange={(e) =>
                    onUpdate("rc_certificate_file", e.target.value || undefined)
                  }
                  placeholder="Nom du fichier..."
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multirisque */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Multirisque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Assurance Multirisque</p>
              <Switch
                checked={data.has_multirisque}
                onCheckedChange={(v) => onUpdate("has_multirisque", v)}
              />
            </div>
          </div>

          {data.has_multirisque && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Compagnie">
                <Input
                  value={data.mr_company ?? ""}
                  onChange={(e) =>
                    onUpdate("mr_company", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="N police">
                <Input
                  value={data.mr_policy_number ?? ""}
                  onChange={(e) =>
                    onUpdate("mr_policy_number", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Date debut">
                <Input
                  type="date"
                  value={data.mr_start_date ?? ""}
                  onChange={(e) =>
                    onUpdate("mr_start_date", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Date expiration">
                <Input
                  type="date"
                  value={data.mr_expiry_date ?? ""}
                  onChange={(e) =>
                    onUpdate("mr_expiry_date", e.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Couverture (FCFA)">
                <Input
                  type="number"
                  value={data.mr_coverage ?? ""}
                  onChange={(e) =>
                    onUpdate(
                      "mr_coverage",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </Field>
              <Field label="Attestation">
                <Input
                  value={data.mr_certificate_file ?? ""}
                  onChange={(e) =>
                    onUpdate("mr_certificate_file", e.target.value || undefined)
                  }
                  placeholder="Nom du fichier..."
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-4">
          <Field label="Notes assurances">
            <Textarea
              value={data.notes ?? ""}
              onChange={(e) => onUpdate("notes", e.target.value || undefined)}
              rows={3}
              placeholder="Observations sur les assurances du locataire..."
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

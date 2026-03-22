import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SupplierIdentity,
  SupplierCategory,
  SupplierStatus,
  SupplierCriticality,
} from "../types";
import {
  SUPPLIER_CATEGORIES,
  SUPPLIER_STATUSES,
  CRITICALITY_LEVELS,
} from "./supplier-form-utils";

interface SupplierTabIdentityProps {
  identity: SupplierIdentity;
  setIdentity: React.Dispatch<React.SetStateAction<SupplierIdentity>>;
}

export function SupplierTabIdentity({
  identity,
  setIdentity,
}: SupplierTabIdentityProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identification legale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Raison sociale *</Label>
              <Input
                value={identity.legal_name}
                onChange={(e) =>
                  setIdentity({ ...identity, legal_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Nom commercial</Label>
              <Input
                value={identity.trade_name ?? ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    trade_name: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Forme juridique *</Label>
              <Select
                value={identity.legal_form}
                onValueChange={(v) =>
                  setIdentity({ ...identity, legal_form: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "SARL",
                    "SA",
                    "SAS",
                    "SARLU",
                    "EI",
                    "GIE",
                    "Association",
                    "Autre",
                  ].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>N° RCCM</Label>
              <Input
                value={identity.rc_number ?? ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    rc_number: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>N° Contribuable *</Label>
              <Input
                value={identity.tax_number}
                onChange={(e) =>
                  setIdentity({ ...identity, tax_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>N° TVA</Label>
              <Input
                value={identity.vat_number ?? ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    vat_number: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Categorie *</Label>
              <Select
                value={identity.category}
                onValueChange={(v) =>
                  setIdentity({ ...identity, category: v as SupplierCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sous-categorie</Label>
              <Input
                value={identity.sub_category ?? ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    sub_category: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Statut *</Label>
              <Select
                value={identity.status}
                onValueChange={(v) =>
                  setIdentity({ ...identity, status: v as SupplierStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Criticite *</Label>
              <Select
                value={identity.criticality}
                onValueChange={(v) =>
                  setIdentity({
                    ...identity,
                    criticality: v as SupplierCriticality,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITICALITY_LEVELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className={c.color}>{c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plafond annuel (FCFA)</Label>
              <Input
                type="number"
                value={identity.annual_cap ?? ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    annual_cap: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Devise facturation</Label>
              <Select
                value={identity.billing_currency}
                onValueChange={(v) =>
                  setIdentity({ ...identity, billing_currency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF - FCFA BCEAO</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar US</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Contact commercial *</Label>
              <Input
                value={identity.commercial_contact}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    commercial_contact: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Telephone *</Label>
              <Input
                value={identity.phone}
                onChange={(e) =>
                  setIdentity({ ...identity, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={identity.email}
                onChange={(e) =>
                  setIdentity({ ...identity, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contact facturation</Label>
              <Input
                value={identity.billing_contact ?? ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    billing_contact: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email facturation</Label>
              <Input
                type="email"
                value={identity.billing_email ?? ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    billing_email: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Pays *</Label>
              <Select
                value={identity.country}
                onValueChange={(v) => setIdentity({ ...identity, country: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                  <SelectItem value="Sénégal">Senegal</SelectItem>
                  <SelectItem value="Mali">Mali</SelectItem>
                  <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Textarea
              value={identity.address ?? ""}
              onChange={(e) =>
                setIdentity({
                  ...identity,
                  address: e.target.value || undefined,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conformite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Conflit d'interet declare</Label>
              <p className="text-sm text-muted-foreground">
                Signaler tout conflit d'interet potentiel
              </p>
            </div>
            <Switch
              checked={identity.conflict_of_interest}
              onCheckedChange={(v) =>
                setIdentity({ ...identity, conflict_of_interest: v })
              }
            />
          </div>
          {identity.conflict_of_interest && (
            <div className="space-y-2">
              <Label>Details du conflit d'interet</Label>
              <Textarea
                value={identity.conflict_detail ?? ""}
                onChange={(e) =>
                  setIdentity({
                    ...identity,
                    conflict_detail: e.target.value || undefined,
                  })
                }
                placeholder="Decrivez la nature du conflit d'interet..."
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Notes internes</Label>
            <Textarea
              value={identity.notes ?? ""}
              onChange={(e) =>
                setIdentity({ ...identity, notes: e.target.value || undefined })
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

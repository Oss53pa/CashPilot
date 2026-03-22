import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { SupplierContract, RelationshipType, PaymentBase } from "../types";
import {
  RELATIONSHIP_TYPES,
  PAYMENT_BASES,
  PAYMENT_METHOD_OPTIONS,
} from "./supplier-form-utils";

interface SupplierTabContractProps {
  contract: SupplierContract;
  setContract: React.Dispatch<React.SetStateAction<SupplierContract>>;
}

export function SupplierTabContract({
  contract,
  setContract,
}: SupplierTabContractProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Informations contractuelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Type de relation *</Label>
              <Select
                value={contract.relationship_type}
                onValueChange={(v) =>
                  setContract({
                    ...contract,
                    relationship_type: v as RelationshipType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference contrat</Label>
              <Input
                value={contract.contract_ref ?? ""}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    contract_ref: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fichier contrat</Label>
              <div className="flex gap-2">
                <Input
                  value={contract.contract_file ?? ""}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date de debut</Label>
              <Input
                type="date"
                value={contract.start_date ?? ""}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    start_date: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={contract.end_date ?? ""}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    end_date: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Preavis (jours)</Label>
              <Input
                type="number"
                value={contract.notice_days ?? ""}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    notice_days: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Reconduction tacite</Label>
                <p className="text-sm text-muted-foreground">
                  Renouvellement automatique a echeance
                </p>
              </div>
              <Switch
                checked={contract.tacit_renewal}
                onCheckedChange={(v) =>
                  setContract({ ...contract, tacit_renewal: v })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Alerte contrat (jours avant fin)</Label>
              <Input
                type="number"
                value={contract.contract_alert_days ?? ""}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    contract_alert_days: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Montants & Facturation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Montant annuel HT (FCFA)</Label>
              <Input
                type="number"
                value={contract.annual_amount ?? ""}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    annual_amount: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Montant mensuel HT (FCFA)</Label>
              <Input
                type="number"
                value={contract.monthly_amount ?? ""}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    monthly_amount: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Frequence de facturation</Label>
              <Select
                value={contract.billing_frequency ?? ""}
                onValueChange={(v) =>
                  setContract({
                    ...contract,
                    billing_frequency: v || undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensuelle">Mensuelle</SelectItem>
                  <SelectItem value="Trimestrielle">Trimestrielle</SelectItem>
                  <SelectItem value="Semestrielle">Semestrielle</SelectItem>
                  <SelectItem value="Annuelle">Annuelle</SelectItem>
                  <SelectItem value="À la commande">A la commande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>TVA applicable</Label>
              </div>
              <Switch
                checked={contract.vat_applicable}
                onCheckedChange={(v) =>
                  setContract({ ...contract, vat_applicable: v })
                }
              />
            </div>
            {contract.vat_applicable && (
              <div className="space-y-2">
                <Label>Taux TVA (%)</Label>
                <Input
                  type="number"
                  value={contract.vat_rate ?? ""}
                  onChange={(e) =>
                    setContract({
                      ...contract,
                      vat_rate: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conditions de paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Delai de paiement (jours) *</Label>
              <Input
                type="number"
                value={contract.payment_delay_days}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    payment_delay_days: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Base de calcul *</Label>
              <Select
                value={contract.payment_base}
                onValueChange={(v) =>
                  setContract({ ...contract, payment_base: v as PaymentBase })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_BASES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taux penalite de retard (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={contract.late_penalty_rate ?? ""}
                onChange={(e) =>
                  setContract({
                    ...contract,
                    late_penalty_rate: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Modes de paiement acceptes</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <Badge
                  key={method}
                  variant={
                    contract.payment_methods.includes(method)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    const methods = contract.payment_methods.includes(method)
                      ? contract.payment_methods.filter((m) => m !== method)
                      : [...contract.payment_methods, method];
                    setContract({ ...contract, payment_methods: methods });
                  }}
                >
                  {method}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Escompte pour paiement anticipe</Label>
              <p className="text-sm text-muted-foreground">
                Remise pour paiement avant echeance
              </p>
            </div>
            <Switch
              checked={contract.early_payment_discount}
              onCheckedChange={(v) =>
                setContract({ ...contract, early_payment_discount: v })
              }
            />
          </div>
          {contract.early_payment_discount && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Taux d'escompte (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={contract.discount_rate ?? ""}
                  onChange={(e) =>
                    setContract({
                      ...contract,
                      discount_rate: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Delai escompte (jours)</Label>
                <Input
                  type="number"
                  value={contract.discount_delay ?? ""}
                  onChange={(e) =>
                    setContract({
                      ...contract,
                      discount_delay: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Retenue de garantie</Label>
              <p className="text-sm text-muted-foreground">
                Applicable aux contrats de travaux
              </p>
            </div>
            <Switch
              checked={contract.has_retention}
              onCheckedChange={(v) =>
                setContract({ ...contract, has_retention: v })
              }
            />
          </div>
          {contract.has_retention && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Taux retenue (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={contract.retention_rate ?? ""}
                  onChange={(e) =>
                    setContract({
                      ...contract,
                      retention_rate: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Duree retenue (mois)</Label>
                <Input
                  type="number"
                  value={contract.retention_duration_months ?? ""}
                  onChange={(e) =>
                    setContract({
                      ...contract,
                      retention_duration_months: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Conditions de liberation</Label>
                <Input
                  value={contract.retention_release_conditions ?? ""}
                  onChange={(e) =>
                    setContract({
                      ...contract,
                      retention_release_conditions: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import {
  AlertTriangle,
  Landmark,
  Plus,
  Trash2,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SupplierBankAccount } from "../types";

interface SupplierTabBankProps {
  bankAccounts: SupplierBankAccount[];
  setBankAccounts: React.Dispatch<React.SetStateAction<SupplierBankAccount[]>>;
  legalName: string;
}

export function SupplierTabBank({
  bankAccounts,
  setBankAccounts,
  legalName,
}: SupplierTabBankProps) {
  const [showIban, setShowIban] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>ALERTE FRAUDE - Verification obligatoire</AlertTitle>
        <AlertDescription>
          Toute modification de coordonnees bancaires doit etre verifiee par
          double validation (confirmation telephonique + document officiel). Ne
          jamais modifier un RIB sur simple demande par email.
        </AlertDescription>
      </Alert>

      {bankAccounts.map((account, idx) => (
        <Card key={account.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                {account.bank_name}
                {account.is_primary && <Badge>Principal</Badge>}
              </CardTitle>
              <div className="flex gap-2">
                {!account.is_primary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBankAccounts(
                        bankAccounts.map((a) => ({
                          ...a,
                          is_primary: a.id === account.id,
                        })),
                      );
                    }}
                  >
                    Definir principal
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setBankAccounts(
                      bankAccounts.filter((a) => a.id !== account.id),
                    )
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Banque</Label>
                <Input
                  value={account.bank_name}
                  onChange={(e) => {
                    const updated = [...bankAccounts];
                    updated[idx] = { ...account, bank_name: e.target.value };
                    setBankAccounts(updated);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input
                  value={account.bank_country}
                  onChange={(e) => {
                    const updated = [...bankAccounts];
                    updated[idx] = { ...account, bank_country: e.target.value };
                    setBankAccounts(updated);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Input value={account.currency} readOnly />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>IBAN</Label>
                <div className="flex gap-2">
                  <Input
                    value={
                      showIban[account.id]
                        ? account.iban
                        : account.iban.replace(
                            /(.{4}).+(.{4})$/,
                            "$1 **** **** **** $2",
                          )
                    }
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowIban({
                        ...showIban,
                        [account.id]: !showIban[account.id],
                      })
                    }
                  >
                    {showIban[account.id] ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>BIC / SWIFT</Label>
                <Input
                  value={account.bic_swift ?? ""}
                  readOnly
                  className="font-mono"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Titulaire</Label>
                <Input value={account.account_holder} readOnly />
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Verification
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Date de verification
                  </p>
                  <p className="text-sm font-medium">
                    {account.verification_date ?? "Non verifie"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Verifie par</p>
                  <p className="text-sm font-medium">
                    {account.verified_by ?? "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Methode</p>
                  <p className="text-sm font-medium">
                    {account.verification_method ?? "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Document</p>
                  <p className="text-sm font-medium">
                    {account.verification_document ?? "-"}
                  </p>
                </div>
              </div>
              {!account.verification_date && (
                <Badge variant="destructive" className="mt-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Compte non verifie
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setBankAccounts([
            ...bankAccounts,
            {
              id: `ba-${Date.now()}`,
              bank_name: "",
              bank_country: "Côte d'Ivoire",
              iban: "",
              bic_swift: "",
              account_holder: legalName,
              currency: "XOF",
              is_primary: bankAccounts.length === 0,
            },
          ]);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un compte bancaire
      </Button>
    </div>
  );
}

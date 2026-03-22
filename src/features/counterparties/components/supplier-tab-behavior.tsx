import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PaymentProfile } from "../types";

interface SupplierTabBehaviorProps {
  paymentProfile: PaymentProfile;
}

export function SupplierTabBehavior({
  paymentProfile,
}: SupplierTabBehaviorProps) {
  const trendLabel = {
    improving: "En amelioration",
    stable: "Stable",
    degrading: "En degradation",
  };
  const vigilanceLabel = {
    normal: "Normal",
    surveillance: "Surveillance",
    alert: "Alerte",
  };
  const vigilanceVariant = {
    normal: "default" as const,
    surveillance: "secondary" as const,
    alert: "destructive" as const,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comportement de paiement (sortant)
          </CardTitle>
          <CardDescription>
            Analyse basee sur {paymentProfile.history_months} mois d'historique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Delai moyen de paiement
              </p>
              <p className="text-2xl font-bold">
                {paymentProfile.avg_delay_days > 0 ? "+" : ""}
                {paymentProfile.avg_delay_days} jours
              </p>
              <p className="text-xs text-muted-foreground">
                {paymentProfile.avg_delay_days < 0
                  ? "En avance sur echeance"
                  : "Apres echeance"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ecart-type</p>
              <p className="text-2xl font-bold">
                {paymentProfile.delay_std_dev} jours
              </p>
              <p className="text-xs text-muted-foreground">
                Regularite des paiements
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Taux paiement integral
              </p>
              <p className="text-2xl font-bold">
                {(paymentProfile.full_payment_rate * 100).toFixed(0)}%
              </p>
              <Progress
                value={paymentProfile.full_payment_rate * 100}
                className="h-2 mt-1"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Taux paiement partiel
              </p>
              <p className="text-2xl font-bold">
                {(paymentProfile.partial_payment_rate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tendance</p>
              <Badge
                variant={
                  paymentProfile.trend === "degrading"
                    ? "destructive"
                    : "default"
                }
              >
                {trendLabel[paymentProfile.trend]}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Vigilance</p>
              <Badge
                variant={vigilanceVariant[paymentProfile.vigilance_status]}
              >
                {vigilanceLabel[paymentProfile.vigilance_status]}
              </Badge>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Score de risque</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${s <= paymentProfile.risk_score ? (s <= 2 ? "bg-green-100 text-green-700" : s <= 3 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700") : "bg-gray-100 text-gray-400"}`}
                >
                  {s}
                </div>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                ({paymentProfile.risk_score}/5)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Surcharges manuelles</CardTitle>
          <CardDescription>
            Ajuster les parametres de prevision pour ce fournisseur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Delai force (jours)</Label>
              <Input
                type="number"
                value={paymentProfile.forced_delay ?? ""}
                placeholder="Automatique"
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                Remplace le delai calcule dans les previsions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useForecasts } from "../../hooks/use-proph3t";
import { HORIZONS, HORIZON_DAYS, type Horizon } from "./forecasts-data";

interface TabPrevisionsProps {
  horizon: Horizon;
  setHorizon: (horizon: Horizon) => void;
}

export function TabPrevisions({ horizon, setHorizon }: TabPrevisionsProps) {
  const { t } = useTranslation("proph3t");
  const { data: forecasts = [], isLoading } = useForecasts();

  const horizonDays = HORIZON_DAYS[horizon];
  const filtered = forecasts.filter((f) => f.horizon === horizonDays);

  return (
    <div className="space-y-4">
      {/* Sélecteur d'horizon */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {t("forecasts.horizon")}
        </span>
        {HORIZONS.map((h) => (
          <Button
            key={h}
            size="sm"
            variant={h === horizon ? "default" : "outline"}
            onClick={() => setHorizon(h)}
          >
            {h}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 py-10 text-center">
            <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">{t("forecasts.noForecasts")}</p>
            <p className="text-sm text-muted-foreground">
              {t("forecasts.noForecastsDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <Card key={f.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">
                    {f.category}
                  </CardTitle>
                  <Badge variant="outline">{f.model_used}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {f.forecast_date}
                </p>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-lg font-semibold">
                  {formatCurrency(f.amount_central)}
                </p>
                {f.amount_lower_80 != null && f.amount_upper_80 != null && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(f.amount_lower_80)} –{" "}
                    {formatCurrency(f.amount_upper_80)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("forecasts.confidence")}:{" "}
                  {Math.round((f.confidence_score ?? f.probability) * 100)}%
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

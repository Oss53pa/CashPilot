import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useCompanyStore } from "@/stores/company.store";
import { RefreshCw, Gauge } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  UncertaintyDistribution,
  CalibrationData,
  UncertaintyDecomposition,
  FanChartPoint,
  ProbabilityQuery,
} from "../components/uncertainty/uncertainty-types";
import * as proph3tService from "../services/proph3t.service";
import type { Horizon } from "../components/forecasts/forecasts-data";
import { TabPrevisions } from "../components/forecasts/tab-previsions";
import { TabIncertitude } from "../components/forecasts/tab-incertitude";

export default function Forecasts() {
  const { t } = useTranslation("proph3t");
  const company = useCompanyStore((s) => s.currentCompany);
  const [horizon, setHorizon] = useState<Horizon>("J+30");
  const [mainTab, setMainTab] = useState<string>("previsions");

  // Uncertainty state
  const [fanChartData, setFanChartData] = useState<FanChartPoint[]>([]);
  const [uncertaintyDist, setUncertaintyDist] =
    useState<UncertaintyDistribution | null>(null);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [decomposition, setDecomposition] = useState<
    UncertaintyDecomposition[]
  >([]);
  const [isLoadingUncertainty, setIsLoadingUncertainty] = useState(false);

  useEffect(() => {
    if (mainTab === "incertitude" && company?.id) {
      setIsLoadingUncertainty(true);
      Promise.all([
        proph3tService.getFanChartData(company.id).then(setFanChartData),
        proph3tService
          .getUncertaintyDistribution(company.id, "fc-001")
          .then(setUncertaintyDist),
        proph3tService.getCalibrationData(company.id).then(setCalibration),
        proph3tService
          .getUncertaintyDecomposition(company.id)
          .then(setDecomposition),
      ]).finally(() => setIsLoadingUncertainty(false));
    }
  }, [mainTab, company?.id]);

  const handleProbabilityQuery = useCallback(
    async (date: string, threshold: number): Promise<ProbabilityQuery> => {
      if (!company?.id) return { probability: 0, date, threshold };
      return proph3tService.queryProbability(company.id, date, threshold);
    },
    [company?.id],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader
        title={t("forecasts.title")}
        description={t("forecasts.description")}
      >
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("forecasts.recalculate")}
        </Button>
      </PageHeader>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="previsions">{t("forecasts.title")}</TabsTrigger>
          <TabsTrigger
            value="incertitude"
            className="flex items-center gap-1.5"
          >
            <Gauge className="h-3.5 w-3.5" />
            {t("forecasts.uncertainty", "Incertitude")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="previsions" className="mt-4 space-y-6">
          <TabPrevisions horizon={horizon} setHorizon={setHorizon} />
        </TabsContent>

        <TabsContent value="incertitude" className="mt-4 space-y-6">
          <TabIncertitude
            isLoading={isLoadingUncertainty}
            fanChartData={fanChartData}
            uncertaintyDist={uncertaintyDist}
            calibration={calibration}
            decomposition={decomposition}
            onProbabilityQuery={handleProbabilityQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

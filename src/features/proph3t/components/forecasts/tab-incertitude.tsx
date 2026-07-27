import { Skeleton } from "@/components/ui/skeleton";
import {
  FanChart,
  DensityChart,
  CalibrationChart,
  UncertaintyDecompositionPanel,
  ProbabilityQueryWidget,
} from "../uncertainty";
import type {
  UncertaintyDistribution,
  CalibrationData,
  UncertaintyDecomposition,
  FanChartPoint,
  ProbabilityQuery,
} from "../uncertainty/uncertainty-types";

interface TabIncertitudeProps {
  isLoading: boolean;
  fanChartData: FanChartPoint[];
  uncertaintyDist: UncertaintyDistribution | null;
  calibration: CalibrationData | null;
  decomposition: UncertaintyDecomposition[];
  onProbabilityQuery: (
    date: string,
    threshold: number,
  ) => Promise<ProbabilityQuery>;
}

export function TabIncertitude({
  isLoading,
  fanChartData,
  uncertaintyDist,
  calibration,
  decomposition,
  onProbabilityQuery,
}: TabIncertitudeProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fanChartData.length > 0 && <FanChart data={fanChartData} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {uncertaintyDist && <DensityChart distribution={uncertaintyDist} />}
        {calibration && <CalibrationChart data={calibration} />}
      </div>

      {decomposition.length > 0 && (
        <UncertaintyDecompositionPanel data={decomposition} />
      )}

      <ProbabilityQueryWidget onQuery={onProbabilityQuery} />
    </div>
  );
}

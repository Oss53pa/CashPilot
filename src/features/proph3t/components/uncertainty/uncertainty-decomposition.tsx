import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UncertaintyDecomposition as DecompositionType } from './uncertainty-types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface UncertaintyDecompositionProps {
  data: DecompositionType[];
}

export function UncertaintyDecompositionPanel({ data }: UncertaintyDecompositionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Decomposition de l'incertitude</CardTitle>
        <CardDescription>
          Repartition aleatoire (irreductible) vs epistemique (reductible) par horizon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.map((item) => (
          <div key={item.horizon} className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs font-semibold">{item.horizon}</Badge>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                  Aleatoire: {item.aleatoric_pct}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" />
                  Epistemique: {item.epistemic_pct}%
                </span>
              </div>
            </div>

            {/* Stacked horizontal bar */}
            <div className="flex h-6 w-full overflow-hidden rounded-md">
              <div
                className="flex items-center justify-center bg-blue-500 text-[10px] font-bold text-white transition-all"
                style={{ width: `${item.aleatoric_pct}%` }}
              >
                {item.aleatoric_pct}%
              </div>
              <div
                className="flex items-center justify-center bg-orange-500 text-[10px] font-bold text-white transition-all"
                style={{ width: `${item.epistemic_pct}%` }}
              >
                {item.epistemic_pct}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <p><span className="text-blue-600 font-medium">Aleatoire:</span> {item.description_aleatoric}</p>
              <p><span className="text-orange-600 font-medium">Epistemique:</span> {item.description_epistemic}</p>
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50 dark:bg-orange-950/20 px-4 py-3">
          <p className="text-xs text-orange-700 dark:text-orange-400">
            L'incertitude epistemique se reduit avec plus de donnees historiques et un meilleur calibrage des modeles.
            A mesure que la base de donnees s'enrichit, la part orange devrait diminuer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

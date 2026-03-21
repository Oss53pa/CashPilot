import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import type { ModelType } from '@/types/proph3t';

interface ModelInfoCardProps {
  modelType: ModelType;
  mape: number;
  historyMonths?: number;
  lastRun?: string;
  className?: string;
}

const modelLabels: Record<ModelType, string> = {
  wma: 'WMA',
  holt_winters: 'Holt-Winters',
  arima: 'ARIMA',
  sarima: 'SARIMA',
  prophet: 'Prophet',
  lstm: 'LSTM',
  ensemble: 'Ensemble',
};

export function ModelInfoCard({ modelType, mape, historyMonths, lastRun, className }: ModelInfoCardProps) {
  const mapePercent = (mape * 100).toFixed(1);
  const healthBadge = mape < 0.10 ? 'success' : mape < 0.20 ? 'warning' : 'destructive';

  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-3 p-3">
        <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{modelLabels[modelType]}</span>
            <Badge variant={healthBadge as 'success' | 'warning' | 'destructive'} className="text-xs">
              MAPE: {mapePercent}%
            </Badge>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            {historyMonths && <span>{historyMonths} mois</span>}
            {lastRun && (
              <span>
                {new Date(lastRun).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

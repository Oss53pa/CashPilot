import { Brain, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ============================================================================
// Proph3t Engine Phase Indicator
// Shows current phase (1-4), available models, next activation
// ============================================================================

interface EngineStatusProps {
  historyMonths: number;
  className?: string;
}

interface PhaseInfo {
  phase: number;
  label: string;
  models: string[];
  capabilities: string[];
  precision30d: string;
}

const PHASES: PhaseInfo[] = [
  {
    phase: 1,
    label: 'Deterministe pur',
    models: ['Budget', 'Flux contractuels'],
    capabilities: ['Prevision deterministe', 'Regles fraude statiques'],
    precision30d: '~85%',
  },
  {
    phase: 2,
    label: 'Statistiques simples',
    models: ['WMA', 'Holt-Winters'],
    capabilities: ['Scoring basique', 'Anomalies par regles', 'Delais reels par contrepartie'],
    precision30d: '~88%',
  },
  {
    phase: 3,
    label: 'Statistiques avancees',
    models: ['ARIMA', 'SARIMA', 'Isolation Forest', 'XGBoost'],
    capabilities: ['Detection anomalies ML', 'Scoring XGBoost', 'What-If NLP', 'Alertes predictives'],
    precision30d: '~92%',
  },
  {
    phase: 4,
    label: 'Pleine puissance',
    models: ['Prophet', 'LSTM', 'Ensemble hybride'],
    capabilities: ['8 capacites completes', 'Ensemble multi-modeles', 'Narratifs automatiques'],
    precision30d: '< 8% MAPE',
  },
];

function getCurrentPhase(months: number): number {
  if (months < 1) return 1;
  if (months < 3) return 2;
  if (months < 12) return 3;
  return 4;
}

function getNextActivation(months: number): { model: string; inMonths: number } | null {
  if (months < 1) return { model: 'WMA / Holt-Winters', inMonths: Math.max(0, 1 - months) };
  if (months < 3) return { model: 'ARIMA', inMonths: Math.max(0, 3 - months) };
  if (months < 6) return { model: 'SARIMA', inMonths: Math.max(0, 6 - months) };
  if (months < 12) return { model: 'Prophet', inMonths: Math.max(0, 12 - months) };
  if (months < 18) return { model: 'LSTM', inMonths: Math.max(0, 18 - months) };
  if (months < 24) return { model: 'Ensemble hybride', inMonths: Math.max(0, 24 - months) };
  return null;
}

export function EngineStatus({ historyMonths, className }: EngineStatusProps) {
  const currentPhase = getCurrentPhase(historyMonths);
  const phaseInfo = PHASES[currentPhase - 1];
  const next = getNextActivation(historyMonths);
  const progressPct = Math.min(100, (currentPhase / 4) * 100);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title + Phase badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Proph3t Engine</span>
                <Badge
                  variant={currentPhase === 4 ? 'success' : 'secondary'}
                  className="text-[10px]"
                >
                  Phase {currentPhase}/4
                </Badge>
              </div>
              {currentPhase === 4 && (
                <Badge variant="success" className="text-[10px]">Pleine puissance</Badge>
              )}
            </div>

            {/* Phase label */}
            <p className="text-xs text-muted-foreground">{phaseInfo.label}</p>

            {/* Progress bar */}
            <div className="space-y-1">
              <Progress
                value={progressPct}
                className={cn(
                  'h-1.5',
                  currentPhase === 4 ? '[&>div]:bg-green-600' : '[&>div]:bg-primary'
                )}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Historique : {historyMonths} mois</span>
                <span>Precision J+30 : {phaseInfo.precision30d}</span>
              </div>
            </div>

            {/* Active models */}
            <div className="flex flex-wrap gap-1">
              {phaseInfo.models.map((model) => (
                <Badge key={model} variant="outline" className="text-[10px] py-0">
                  {model}
                </Badge>
              ))}
            </div>

            {/* Next activation */}
            {next && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
                <ChevronRight className="h-3 w-3" />
                Prochaine activation : <span className="font-medium">{next.model}</span> dans {Math.ceil(next.inMonths)} mois
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

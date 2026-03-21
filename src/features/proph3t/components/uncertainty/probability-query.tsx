import { useState, useCallback } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ProbabilityQuery as ProbabilityQueryType } from './uncertainty-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProbabilityQueryProps {
  onQuery: (date: string, threshold: number) => Promise<ProbabilityQueryType>;
}

export function ProbabilityQueryWidget({ onQuery }: ProbabilityQueryProps) {
  const [date, setDate] = useState('2026-04-15');
  const [thresholdStr, setThresholdStr] = useState('50000000');
  const [result, setResult] = useState<ProbabilityQueryType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = useCallback(async () => {
    const threshold = parseInt(thresholdStr, 10);
    if (isNaN(threshold) || !date) return;
    setLoading(true);
    try {
      const res = await onQuery(date, threshold);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [date, thresholdStr, onQuery]);

  const probabilityColor = result
    ? result.probability > 50 ? 'text-red-600' : result.probability > 20 ? 'text-orange-500' : 'text-green-600'
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Requete de probabilite
        </CardTitle>
        <CardDescription>
          Calculer la probabilite que la position soit inferieure a un seuil donne
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date cible</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Seuil (FCFA)</label>
            <Input
              type="number"
              value={thresholdStr}
              onChange={(e) => setThresholdStr(e.target.value)}
              className="w-[180px]"
              placeholder="Ex: 50000000"
            />
          </div>
          <Button
            onClick={handleCalculate}
            disabled={loading}
            size="sm"
          >
            {loading ? 'Calcul...' : 'Calculer'}
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border bg-muted/30 px-4 py-4 space-y-2">
            <p className="text-sm">
              La probabilite que la position soit inferieure a{' '}
              <strong>{formatFCFA(result.threshold)}</strong>{' '}
              le <strong>{result.date}</strong> est de :
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${probabilityColor}`}>
                {result.probability}%
              </span>
              <Badge variant={result.probability > 50 ? 'destructive' : result.probability > 20 ? 'warning' : 'success'}>
                {result.probability > 50 ? 'Risque eleve' : result.probability > 20 ? 'Risque modere' : 'Risque faible'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, Target } from 'lucide-react';
import type { Proph3tWhatIfSession } from '@/types/proph3t';

interface WhatIfResultCardProps {
  session: Proph3tWhatIfSession;
}

const intentLabels: Record<string, string> = {
  position_if_no_payment: 'Impact non-paiement',
  position_if_investment: 'Impact investissement',
  max_capex_budget: 'Budget CAPEX max',
  credit_line_impact: 'Impact ligne de crédit',
  scenario_comparison: 'Comparaison scénarios',
  days_of_cash: 'Jours de trésorerie',
  break_even_date: 'Date point mort',
  stress_test: 'Stress test',
};

export function WhatIfResultCard({ session }: WhatIfResultCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              {intentLabels[session.intent_detected] || session.intent_detected}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {Math.round(session.confidence * 100)}%
            </Badge>
            {session.execution_ms != null && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {session.execution_ms}ms
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/50 rounded px-3 py-2">
          <p className="text-xs text-muted-foreground italic">"{session.query_text}"</p>
        </div>
        <p className="text-sm leading-relaxed">{session.narrative}</p>
        {session.result && Object.keys(session.result).length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(session.result)
              .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
              .slice(0, 6)
              .map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="text-muted-foreground">{key.replace(/_/g, ' ')}: </span>
                  <span className="font-medium">
                    {typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

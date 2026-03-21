import { Link } from 'react-router-dom';
import { FlaskConical, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CausalIntervention } from './causal-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFCFA(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M FCFA`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(0)}K FCFA`;
  return `${amount} FCFA`;
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return 'text-green-600';
  if (c >= 0.6) return 'text-yellow-600';
  return 'text-orange-600';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CausalInterventionsProps {
  interventions: CausalIntervention[];
}

export function CausalInterventions({ interventions }: CausalInterventionsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {interventions.map((iv, idx) => (
        <Card key={idx} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-2">
              <FlaskConical className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <CardTitle className="text-sm font-semibold leading-snug">{iv.question}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {/* Intervention details */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">Variable: {iv.intervention_variable}</Badge>
              <Badge variant="outline">Valeur: {iv.intervention_value}</Badge>
            </div>

            {/* Effect */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Effet estime</span>
                <span className={`text-lg font-bold ${iv.estimated_effect >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {iv.estimated_effect >= 0 ? '+' : ''}{formatFCFA(iv.estimated_effect)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Confiance</span>
                <span className={`text-sm font-semibold ${confidenceColor(iv.confidence)}`}>
                  {(iv.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-muted-foreground leading-relaxed">{iv.explanation}</p>

            {/* Link to what-if simulator */}
            <div className="mt-auto pt-2">
              <Link to="/proph3t/what-if">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Appliquer dans le simulateur
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

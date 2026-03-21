import { useState } from 'react';
import { ThumbsUp, ThumbsDown, ShieldCheck, Info, Zap, Lightbulb } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FraudScoreGauge } from '../fraud-score-gauge';
import type { AnomalyExplanation, CounterfactualExplanation } from './anomaly-explanation-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeConfig: Record<CounterfactualExplanation['type'], { label: string; color: string; icon: typeof Info }> = {
  minimal: { label: 'Minimal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Info },
  contextual: { label: 'Contextuel', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: Lightbulb },
  actionable: { label: 'Actionnable', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: Zap },
};

const barColors = ['#ef4444', '#f97316', '#eab308', '#6366f1', '#a3a3a3'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExplanationPanelProps {
  explanation: AnomalyExplanation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedback?: (anomalyId: string, feedback: 'helpful' | 'not_helpful') => void;
  onDismiss?: (anomalyId: string) => void;
}

export function ExplanationPanel({
  explanation,
  open,
  onOpenChange,
  onFeedback,
  onDismiss,
}: ExplanationPanelProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(
    explanation?.user_feedback ?? null
  );

  if (!explanation) return null;

  const featureData = explanation.anomaly_features.map((f) => ({
    name: f.name,
    contribution: Math.round(f.contribution * 100),
  }));

  const handleFeedback = (fb: 'helpful' | 'not_helpful') => {
    setFeedback(fb);
    onFeedback?.(explanation.anomaly_id, fb);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Pourquoi c'est anormal ?</DialogTitle>
          <DialogDescription>{explanation.transaction_description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Header info */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col items-center">
              <span className="text-xs text-muted-foreground mb-1">Score d'anomalie</span>
              <FraudScoreGauge score={Math.round(explanation.anomaly_score * 100)} size="md" />
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Transaction:</span> {explanation.transaction_id}</p>
              <p><span className="text-muted-foreground">Genere le:</span> {new Date(explanation.generated_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Feature contributions bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contributions des features a l'anomalie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Contribution']} />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                    {featureData.map((_, index) => (
                      <Cell key={index} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {explanation.anomaly_features.map((f) => (
                  <div key={f.name} className="flex justify-between text-xs text-muted-foreground">
                    <span>{f.name}</span>
                    <span className="font-medium text-foreground">{f.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Counterfactual cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Explications contrefactuelles</h4>
            {explanation.counterfactuals.map((cf) => {
              const config = typeConfig[cf.type];
              const Icon = config.icon;
              return (
                <Card key={cf.id} className="border-l-4" style={{ borderLeftColor: cf.type === 'minimal' ? '#3b82f6' : cf.type === 'contextual' ? '#8b5cf6' : '#22c55e' }}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Confiance: {Math.round(cf.confidence * 100)}%
                      </Badge>
                    </div>

                    <p className="text-sm">{cf.description_fr}</p>

                    {/* Changed features table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-3 py-1.5 font-medium">Feature</th>
                            <th className="text-left px-3 py-1.5 font-medium">Valeur actuelle</th>
                            <th className="text-left px-3 py-1.5 font-medium">Contrefactuel</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cf.changed_features.map((feat, i) => (
                            <tr key={i} className="border-b">
                              <td className="px-3 py-1.5 text-muted-foreground">{feat.feature}</td>
                              <td className="px-3 py-1.5 font-medium text-red-600">{feat.original}</td>
                              <td className="px-3 py-1.5 font-medium text-green-600">{feat.counterfactual}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 pt-4">
          <div className="flex gap-2 flex-1">
            <Button
              variant={feedback === 'helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFeedback('helpful')}
            >
              <ThumbsUp className="mr-1.5 h-4 w-4" />
              Utile
            </Button>
            <Button
              variant={feedback === 'not_helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFeedback('not_helpful')}
            >
              <ThumbsDown className="mr-1.5 h-4 w-4" />
              Pas utile
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onDismiss?.(explanation.anomaly_id);
              onOpenChange(false);
            }}
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" />
            Marquer comme normal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

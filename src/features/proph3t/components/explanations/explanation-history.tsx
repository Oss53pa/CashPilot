import { useState, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { AnomalyExplanation } from './anomaly-explanation-types';

// ---------------------------------------------------------------------------
// Mock history data
// ---------------------------------------------------------------------------

const mockHistory: AnomalyExplanation[] = [
  {
    anomaly_id: 'ano-001',
    transaction_id: 'TXN-2026-0487',
    transaction_description: 'Paiement 8 400 000 FCFA a GLOBAL SERVICES INTL',
    anomaly_score: 0.87,
    anomaly_features: [
      { name: 'Montant', value: '8 400 000 FCFA', contribution: 0.35 },
      { name: 'Fournisseur inconnu', value: 'Oui', contribution: 0.28 },
    ],
    counterfactuals: [],
    user_feedback: 'helpful',
    generated_at: '2026-03-21T10:30:00Z',
  },
  {
    anomaly_id: 'ano-002',
    transaction_id: 'TXN-2026-0412',
    transaction_description: 'Doublon virement 8 500 000 FCFA a SAHAM Assurance',
    anomaly_score: 0.92,
    anomaly_features: [
      { name: 'Doublon', value: 'Oui', contribution: 0.55 },
      { name: 'Montant identique', value: '8 500 000 FCFA', contribution: 0.30 },
    ],
    counterfactuals: [],
    user_feedback: 'helpful',
    generated_at: '2026-03-20T14:22:00Z',
  },
  {
    anomaly_id: 'ano-003',
    transaction_id: 'TXN-2026-0398',
    transaction_description: 'Transaction 25 000 000 FCFA a 23h47 depuis SGBCI',
    anomaly_score: 0.95,
    anomaly_features: [
      { name: 'Heure', value: '23h47', contribution: 0.40 },
      { name: 'Montant eleve', value: '25 000 000 FCFA', contribution: 0.35 },
    ],
    counterfactuals: [],
    user_feedback: 'not_helpful',
    generated_at: '2026-03-19T23:47:00Z',
  },
  {
    anomaly_id: 'ano-004',
    transaction_id: 'TXN-2026-0355',
    transaction_description: 'Paiement 45 200 000 FCFA a BATIREX SARL',
    anomaly_score: 0.71,
    anomaly_features: [
      { name: 'Montant 3.2x moyenne', value: '45 200 000 FCFA', contribution: 0.45 },
    ],
    counterfactuals: [],
    user_feedback: null,
    generated_at: '2026-03-18T11:05:00Z',
  },
  {
    anomaly_id: 'ano-005',
    transaction_id: 'TXN-2026-0320',
    transaction_description: 'Serie 4 virements de 5 000 000 FCFA — fractionnement',
    anomaly_score: 0.64,
    anomaly_features: [
      { name: 'Fractionnement', value: '4 x 5M en 15 min', contribution: 0.50 },
    ],
    counterfactuals: [],
    user_feedback: 'not_helpful',
    generated_at: '2026-03-16T15:20:00Z',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExplanationHistoryProps {
  data?: AnomalyExplanation[];
}

export function ExplanationHistory({ data }: ExplanationHistoryProps) {
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');

  const historyData = data || mockHistory;

  const filtered = useMemo(() => {
    if (feedbackFilter === 'all') return historyData;
    if (feedbackFilter === 'pending') return historyData.filter((e) => e.user_feedback === null);
    return historyData.filter((e) => e.user_feedback === feedbackFilter);
  }, [historyData, feedbackFilter]);

  const feedbackIcon = (fb: AnomalyExplanation['user_feedback']) => {
    if (fb === 'helpful') return <ThumbsUp className="h-3.5 w-3.5 text-green-600" />;
    if (fb === 'not_helpful') return <ThumbsDown className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const feedbackLabel = (fb: AnomalyExplanation['user_feedback']) => {
    if (fb === 'helpful') return 'Utile';
    if (fb === 'not_helpful') return 'Pas utile';
    return 'En attente';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Historique des explications</CardTitle>
            <CardDescription>{historyData.length} explications generees</CardDescription>
          </div>
          <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="helpful">Utiles</SelectItem>
              <SelectItem value="not_helpful">Pas utiles</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Transaction</th>
                <th className="text-center px-4 py-3 font-medium">Score</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-center px-4 py-3 font-medium">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.anomaly_id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                    {new Date(exp.generated_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{exp.transaction_id}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={exp.anomaly_score >= 0.8 ? 'destructive' : exp.anomaly_score >= 0.6 ? 'warning' : 'secondary'}>
                      {Math.round(exp.anomaly_score * 100)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="truncate text-xs">{exp.transaction_description}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {feedbackIcon(exp.user_feedback)}
                      <span className="text-xs">{feedbackLabel(exp.user_feedback)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

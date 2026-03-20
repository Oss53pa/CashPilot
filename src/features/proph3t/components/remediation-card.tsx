import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, DollarSign, Target } from 'lucide-react';
import { formatAmount } from '@/lib/format';
import type { RemediationOption } from '@/types/proph3t';

interface RemediationCardProps {
  option: RemediationOption;
  rank: number;
  onSelect?: () => void;
  selected?: boolean;
}

export function RemediationCard({ option, rank, onSelect, selected }: RemediationCardProps) {
  const scorePercent = Math.round((option.composite_score ?? 0) * 100);

  return (
    <Card className={selected ? 'border-primary ring-2 ring-primary/20' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              #{rank}
            </Badge>
            <CardTitle className="text-sm font-medium">{option.action.replace(/_/g, ' ')}</CardTitle>
          </div>
          <Badge variant="secondary">{scorePercent}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{option.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {option.amount > 0 && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span>{formatAmount(option.amount / 100, 'XOF')}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{option.delay_days}j</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span>{Math.round(option.probability_of_success * 100)}% succès</span>
          </div>
          {option.cost > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <DollarSign className="h-3 w-3" />
              <span>Coût: {formatAmount(option.cost / 100, 'XOF')}</span>
            </div>
          )}
        </div>

        {option.warning && (
          <p className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1">{option.warning}</p>
        )}

        <p className="text-xs font-medium">{option.impact}</p>

        {option.steps && option.steps.length > 0 && (
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            {(option.steps as string[]).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        )}

        {onSelect && (
          <Button
            size="sm"
            variant={selected ? 'default' : 'outline'}
            onClick={onSelect}
            className="w-full"
          >
            <CheckCircle className="mr-2 h-3 w-3" />
            {selected ? 'Sélectionné' : 'Sélectionner'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

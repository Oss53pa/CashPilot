import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Granularity } from '../types';

interface ForecastContextBarProps {
  scenario: 'base' | 'optimistic' | 'pessimistic';
  onScenarioChange: (v: 'base' | 'optimistic' | 'pessimistic') => void;
  granularity: Granularity;
  onGranularityChange: (v: Granularity) => void;
  showConfidence: boolean;
  onToggleConfidence: () => void;
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  periodStart: string;
  periodEnd: string;
}

export function ForecastContextBar({
  scenario,
  onScenarioChange,
  granularity,
  onGranularityChange,
  showConfidence,
  onToggleConfidence,
  lastUpdated,
  onRefresh,
  isRefreshing,
  periodStart,
  periodEnd,
}: ForecastContextBarProps) {
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      {/* Scenario */}
      <Select value={scenario} onValueChange={(v) => onScenarioChange(v as typeof scenario)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Scénario" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="base">Base</SelectItem>
          <SelectItem value="optimistic">Optimiste</SelectItem>
          <SelectItem value="pessimistic">Pessimiste</SelectItem>
        </SelectContent>
      </Select>

      {/* Granularity */}
      <Select value={granularity} onValueChange={(v) => onGranularityChange(v as Granularity)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Granularité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="weekly_monthly">Hebdo + Mensuel</SelectItem>
          <SelectItem value="monthly">Mensuel</SelectItem>
          <SelectItem value="quarterly">Trimestriel</SelectItem>
          <SelectItem value="plan_13_weeks">Plan 13 semaines</SelectItem>
        </SelectContent>
      </Select>

      {/* Currency & Scope */}
      <Badge variant="outline" className="text-xs font-medium">
        FCFA (XOF)
      </Badge>
      <Badge variant="outline" className="text-xs font-medium">
        Société
      </Badge>

      {/* Horizon */}
      <span className="text-xs text-muted-foreground">
        {periodStart} &rarr; {periodEnd}
      </span>

      <div className="flex-1" />

      {/* Updated */}
      <span className="text-xs text-muted-foreground">
        Mis à jour : {updatedLabel}
      </span>

      {/* Refresh */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        Actualiser
      </Button>

      {/* Confidence toggle */}
      <Button variant="ghost" size="sm" onClick={onToggleConfidence}>
        {showConfidence ? (
          <EyeOff className="mr-1 h-3.5 w-3.5" />
        ) : (
          <Eye className="mr-1 h-3.5 w-3.5" />
        )}
        IC 80%
      </Button>
    </div>
  );
}

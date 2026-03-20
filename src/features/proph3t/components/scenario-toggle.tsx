import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ForecastScenario } from '@/types/proph3t';

interface ScenarioToggleProps {
  value: ForecastScenario;
  onChange: (scenario: ForecastScenario) => void;
}

const scenarios: { value: ForecastScenario; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'optimistic', label: 'Optimiste' },
  { value: 'pessimistic', label: 'Pessimiste' },
];

export function ScenarioToggle({ value, onChange }: ScenarioToggleProps) {
  return (
    <div className="inline-flex rounded-md border">
      {scenarios.map((s) => (
        <Button
          key={s.value}
          variant="ghost"
          size="sm"
          className={cn(
            'rounded-none first:rounded-l-md last:rounded-r-md border-r last:border-r-0',
            value === s.value && 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          onClick={() => onChange(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}

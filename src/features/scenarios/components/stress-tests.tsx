import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  ShieldAlert,
  Zap,
  Building2,
  TrendingDown,
  CreditCard,
  Play,
} from 'lucide-react';
import { useRunStressTest } from '../hooks/use-scenarios';
import type { StressTest, StressTestResult, StressTestType } from '../types';
import { formatCurrency } from '@/lib/utils';

interface StressTestDefinition {
  id: string;
  type: StressTestType;
  name: string;
  description: string;
  icon: React.ReactNode;
  parameterLabels: { key: string; label: string; type: 'number' | 'select'; options?: string[] }[];
  defaultParams: Record<string, string | number>;
}

const STRESS_TESTS: StressTestDefinition[] = [
  {
    id: 'st-1',
    type: 'tenant_loss',
    name: 'Loss of Major Tenant',
    description:
      'Simulate the sudden departure of a major tenant, resulting in loss of rental income for N months.',
    icon: <Building2 className="h-5 w-5" />,
    parameterLabels: [
      {
        key: 'tenant',
        label: 'Tenant',
        type: 'select',
        options: ['Dupont SCI', 'MegaCorp SA', 'TechStart SAS', 'Retail Plus SARL'],
      },
      { key: 'duration_months', label: 'Duration (months)', type: 'number' },
    ],
    defaultParams: { tenant: 'MegaCorp SA', duration_months: 6 },
  },
  {
    id: 'st-2',
    type: 'mass_delay',
    name: 'Mass Payment Delay',
    description:
      '30% of tenants delay payments by 60 days simultaneously. Tests resilience to systemic late payments.',
    icon: <TrendingDown className="h-5 w-5" />,
    parameterLabels: [
      { key: 'pct_tenants', label: 'Affected tenants (%)', type: 'number' },
      { key: 'delay_days', label: 'Delay (days)', type: 'number' },
    ],
    defaultParams: { pct_tenants: 30, delay_days: 60 },
  },
  {
    id: 'st-3',
    type: 'charge_shock',
    name: 'Charge Shock',
    description:
      'An unexpected major expense hits the treasury. Test impact of unplanned capital outflow.',
    icon: <Zap className="h-5 w-5" />,
    parameterLabels: [
      { key: 'amount', label: 'Expense amount (FCFA)', type: 'number' },
    ],
    defaultParams: { amount: 15_000_000 },
  },
  {
    id: 'st-4',
    type: 'bank_blockage',
    name: 'Bank Account Blockage',
    description:
      'A bank account becomes temporarily unavailable due to regulatory or technical issues.',
    icon: <ShieldAlert className="h-5 w-5" />,
    parameterLabels: [
      {
        key: 'account',
        label: 'Account',
        type: 'select',
        options: ['Compte principal BCEAO', 'Compte operations SG', 'Compte reserve BOA'],
      },
      { key: 'duration_days', label: 'Duration (days)', type: 'number' },
    ],
    defaultParams: { account: 'Compte principal BCEAO', duration_days: 14 },
  },
  {
    id: 'st-5',
    type: 'fx_shock',
    name: 'FX Shock',
    description:
      'Sudden appreciation or depreciation of local currency affecting foreign-denominated flows.',
    icon: <AlertTriangle className="h-5 w-5" />,
    parameterLabels: [
      { key: 'pct_change', label: 'Rate change (%)', type: 'number' },
      {
        key: 'direction',
        label: 'Direction',
        type: 'select',
        options: ['Appreciation', 'Depreciation'],
      },
    ],
    defaultParams: { pct_change: 15, direction: 'Depreciation' },
  },
  {
    id: 'st-6',
    type: 'credit_revocation',
    name: 'Credit Line Revocation',
    description:
      'The bank revokes or reduces available credit lines. Tests ability to operate without credit backstop.',
    icon: <CreditCard className="h-5 w-5" />,
    parameterLabels: [],
    defaultParams: {},
  },
];

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export function StressTests() {
  const runStressTest = useRunStressTest();
  const [params, setParams] = useState<Record<string, Record<string, string | number>>>(
    Object.fromEntries(STRESS_TESTS.map((st) => [st.id, { ...st.defaultParams }]))
  );
  const [results, setResults] = useState<Record<string, StressTestResult>>({});
  const [runningId, setRunningId] = useState<string | null>(null);

  function updateParam(testId: string, key: string, value: string | number) {
    setParams((prev) => ({
      ...prev,
      [testId]: { ...prev[testId], [key]: value },
    }));
  }

  async function handleRun(def: StressTestDefinition) {
    setRunningId(def.id);
    const stressTest: StressTest = {
      id: def.id,
      name: def.name,
      type: def.type,
      description: def.description,
      parameters: params[def.id] ?? {},
    };

    runStressTest.mutate(stressTest, {
      onSuccess: (result) => {
        setResults((prev) => ({ ...prev, [def.id]: result }));
        setRunningId(null);
      },
      onError: () => {
        setRunningId(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STRESS_TESTS.map((def) => {
          const result = results[def.id];

          return (
            <Card key={def.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {def.icon}
                  <CardTitle className="text-base">{def.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground">{def.description}</p>

                {/* Parameters */}
                {def.parameterLabels.length > 0 && (
                  <div className="space-y-2">
                    {def.parameterLabels.map((param) => (
                      <div key={param.key}>
                        <Label className="text-xs">{param.label}</Label>
                        {param.type === 'select' ? (
                          <Select
                            value={String(params[def.id]?.[param.key] ?? '')}
                            onValueChange={(v) => updateParam(def.id, param.key, v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {param.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type="number"
                            className="h-8 text-sm"
                            value={params[def.id]?.[param.key] ?? ''}
                            onChange={(e) =>
                              updateParam(def.id, param.key, Number(e.target.value))
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleRun(def)}
                  disabled={runningId === def.id}
                >
                  <Play className="mr-2 h-3.5 w-3.5" />
                  {runningId === def.id ? 'Running...' : 'Run Test'}
                </Button>

                {/* Results */}
                {result && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Severity</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${severityColors[result.severity]}`}
                        >
                          {result.severity.toUpperCase()}
                        </Badge>
                      </div>

                      <div>
                        <span className="text-xs text-muted-foreground">Position under stress</span>
                        <p className="text-lg font-bold">
                          {formatCurrency(result.position_under_stress, 'XOF', 'fr-FR')}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs text-muted-foreground">
                          Days to critical threshold
                        </span>
                        <p
                          className={`text-lg font-bold ${
                            result.days_to_threshold <= 30
                              ? 'text-red-600'
                              : result.days_to_threshold <= 60
                                ? 'text-amber-600'
                                : 'text-green-600'
                          }`}
                        >
                          {result.days_to_threshold} days
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-medium">Available Levers</span>
                        <div className="mt-1 space-y-2">
                          {result.available_levers.map((lever) => (
                            <div
                              key={lever.name}
                              className="rounded-md border p-2 text-xs space-y-0.5"
                            >
                              <p className="font-medium">{lever.name}</p>
                              <p className="text-muted-foreground">{lever.description}</p>
                              {lever.estimated_impact > 0 && (
                                <p className="text-green-600 font-medium">
                                  Impact: +{formatCurrency(lever.estimated_impact, 'XOF', 'fr-FR')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

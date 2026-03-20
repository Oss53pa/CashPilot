import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RotateCcw } from 'lucide-react';
import { useRunWhatIf } from '../hooks/use-scenarios';
import type { WhatIfParameters, WhatIfResult } from '../types';
import { formatCurrency } from '@/lib/utils';

const DEFAULT_PARAMS: WhatIfParameters = {
  recovery_rate: 85,
  payment_delay_adjustment: 0,
  additional_expense: 0,
  revenue_change: 0,
  capex_timing_shift: 0,
};

export function WhatIfSimulator() {
  const runWhatIf = useRunWhatIf();
  const [params, setParams] = useState<WhatIfParameters>(DEFAULT_PARAMS);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [showBase, setShowBase] = useState(true);

  function updateParam<K extends keyof WhatIfParameters>(key: K, value: WhatIfParameters[K]) {
    setParams((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setParams(DEFAULT_PARAMS);
    setResult(null);
  }

  // Auto-run simulation when params change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      runWhatIf.mutate(params, {
        onSuccess: (data) => setResult(data),
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [params]);

  // Merge base and projected data for chart
  const chartData =
    result?.projected_data.map((d, i) => ({
      month: d.month,
      projected: d.position,
      base: result.base_data[i]?.position ?? 0,
    })) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Left Panel: Parameter Controls */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Parameters</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Recovery Rate */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Recovery Rate</Label>
                <span className="text-sm font-medium">{params.recovery_rate}%</span>
              </div>
              <Input
                type="range"
                min={0}
                max={100}
                step={1}
                value={params.recovery_rate}
                onChange={(e) => updateParam('recovery_rate', Number(e.target.value))}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Payment Delay Adjustment */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Payment Delay Adj.</Label>
                <span className="text-sm font-medium">
                  {params.payment_delay_adjustment > 0 ? '+' : ''}
                  {params.payment_delay_adjustment} days
                </span>
              </div>
              <Input
                type="range"
                min={-30}
                max={60}
                step={1}
                value={params.payment_delay_adjustment}
                onChange={(e) => updateParam('payment_delay_adjustment', Number(e.target.value))}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-30 days</span>
                <span>+60 days</span>
              </div>
            </div>

            {/* Additional Expense */}
            <div className="space-y-2">
              <Label className="text-sm">Additional Expense (FCFA)</Label>
              <Input
                type="number"
                min={0}
                step={500000}
                value={params.additional_expense}
                onChange={(e) => updateParam('additional_expense', Number(e.target.value))}
                placeholder="0"
              />
            </div>

            {/* Revenue Change */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Revenue Change</Label>
                <span className="text-sm font-medium">
                  {params.revenue_change > 0 ? '+' : ''}
                  {params.revenue_change}%
                </span>
              </div>
              <Input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={params.revenue_change}
                onChange={(e) => updateParam('revenue_change', Number(e.target.value))}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-50%</span>
                <span>+50%</span>
              </div>
            </div>

            {/* CAPEX Timing */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">CAPEX Timing Shift</Label>
                <span className="text-sm font-medium">
                  {params.capex_timing_shift > 0 ? '+' : ''}
                  {params.capex_timing_shift} month{Math.abs(params.capex_timing_shift) !== 1 ? 's' : ''}
                </span>
              </div>
              <Input
                type="range"
                min={-3}
                max={6}
                step={1}
                value={params.capex_timing_shift}
                onChange={(e) => updateParam('capex_timing_shift', Number(e.target.value))}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-3 months</span>
                <span>+6 months</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Impact */}
        {result && (
          <Card>
            <CardContent className="py-4">
              <div className="text-sm text-muted-foreground">Net Impact (avg.)</div>
              <p
                className={`text-2xl font-bold ${
                  result.net_impact >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {result.net_impact >= 0 ? '+' : ''}
                {formatCurrency(result.net_impact, 'XOF', 'fr-FR')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel: Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Projected Cash Position (12 months)</CardTitle>
            <div className="flex items-center gap-2">
              <Switch id="show-base" checked={showBase} onCheckedChange={setShowBase} />
              <Label htmlFor="show-base" className="text-sm">
                Compare with base
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={450}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    `${(v / 1_000_000).toFixed(0)}M`
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, 'XOF', 'fr-FR')}
                />
                <Legend />
                {showBase && (
                  <Area
                    type="monotone"
                    dataKey="base"
                    stroke="#a3a3a3"
                    fill="#a3a3a3"
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    name="Base Scenario"
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#171717"
                  fill="#171717"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Projected"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[450px] text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">Adjust parameters to see projections</p>
                <p className="text-sm">Use the sliders on the left to model different scenarios</p>
              </div>
            </div>
          )}

          {/* Parameter summary badges */}
          {result && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <Badge variant="secondary">Recovery: {params.recovery_rate}%</Badge>
              <Badge variant="secondary">
                Delay: {params.payment_delay_adjustment > 0 ? '+' : ''}
                {params.payment_delay_adjustment}d
              </Badge>
              {params.additional_expense > 0 && (
                <Badge variant="secondary">
                  Expense: {formatCurrency(params.additional_expense, 'XOF', 'fr-FR')}
                </Badge>
              )}
              <Badge variant="secondary">
                Revenue: {params.revenue_change > 0 ? '+' : ''}
                {params.revenue_change}%
              </Badge>
              {params.capex_timing_shift !== 0 && (
                <Badge variant="secondary">
                  CAPEX: {params.capex_timing_shift > 0 ? '+' : ''}
                  {params.capex_timing_shift}m
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

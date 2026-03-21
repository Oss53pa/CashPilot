import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CausalDecomposition, CausalCause } from './causal-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFCFA(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M FCFA`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(0)}K FCFA`;
  return `${amount} FCFA`;
}

// ---------------------------------------------------------------------------
// Waterfall chart data
// ---------------------------------------------------------------------------

interface WaterfallBar {
  name: string;
  value: number;
  start: number;
  end: number;
  fill: string;
  isTotal?: boolean;
}

function buildWaterfallData(decomposition: CausalDecomposition): WaterfallBar[] {
  // We start at 0 (relative) and show each cause as a step
  const bars: WaterfallBar[] = [];
  let running = 0;

  decomposition.causes.forEach((cause) => {
    const start = running;
    const end = running + cause.amount;
    bars.push({
      name: cause.label.length > 30 ? cause.label.substring(0, 28) + '...' : cause.label,
      value: cause.amount,
      start: Math.min(start, end),
      end: Math.max(start, end),
      fill: cause.amount < 0 ? '#ef4444' : '#22c55e',
    });
    running = end;
  });

  // Residual
  if (decomposition.residual_amount !== 0) {
    const start = running;
    const end = running + decomposition.residual_amount;
    bars.push({
      name: 'Residuel',
      value: decomposition.residual_amount,
      start: Math.min(start, end),
      end: Math.max(start, end),
      fill: '#94a3b8',
    });
    running = end;
  }

  // Total bar
  bars.push({
    name: 'Variation totale',
    value: decomposition.total_variation,
    start: 0,
    end: Math.abs(decomposition.total_variation),
    fill: decomposition.total_variation < 0 ? '#dc2626' : '#16a34a',
    isTotal: true,
  });

  return bars;
}

// ---------------------------------------------------------------------------
// Expandable cause row
// ---------------------------------------------------------------------------

function CauseRow({ cause, depth = 0 }: { cause: CausalCause; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = cause.children && cause.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${hasChildren ? 'cursor-pointer' : ''}`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <span className="inline-block w-4" />
        )}
        <span className="flex-1 font-medium">{cause.label}</span>
        <Badge variant={cause.type === 'root_cause' ? 'secondary' : cause.type === 'indirect' ? 'outline' : 'default'} className="text-xs">
          {cause.type === 'root_cause' ? 'Cause racine' : cause.type === 'indirect' ? 'Indirect' : 'Direct'}
        </Badge>
        <span className={`font-bold text-sm min-w-[100px] text-right ${cause.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatFCFA(cause.amount)}
        </span>
        <span className="text-xs text-muted-foreground min-w-[40px] text-right">{cause.pct}%</span>
        <span className="text-xs text-muted-foreground min-w-[60px] text-right">conf. {(cause.confidence * 100).toFixed(0)}%</span>
      </div>
      {expanded && cause.children?.map((child, i) => (
        <CauseRow key={i} cause={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CausalDecompositionVizProps {
  decomposition: CausalDecomposition;
}

export function CausalDecompositionViz({ decomposition }: CausalDecompositionVizProps) {
  const waterfallData = buildWaterfallData(decomposition);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Decomposition causale - {decomposition.period}</CardTitle>
          <CardDescription>
            Variation totale: <strong className="text-red-600">{formatFCFA(decomposition.total_variation)}</strong> — Residuel non explique: {decomposition.residual_pct}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={waterfallData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(value: number) => [formatFCFA(value), 'Montant']}
                labelStyle={{ fontSize: 11 }}
              />
              <ReferenceLine y={0} stroke="#666" />
              <Bar dataKey="end" radius={[3, 3, 0, 0]}>
                {waterfallData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detail list with expandable causes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detail des causes</CardTitle>
          <CardDescription>Cliquez sur une cause pour voir la chaine de causes racines</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {decomposition.causes.map((cause, i) => (
              <CauseRow key={i} cause={cause} />
            ))}
            {/* Residual */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ paddingLeft: '32px' }}>
              <span className="inline-block w-4" />
              <span className="flex-1 font-medium text-muted-foreground">Residuel (non explique)</span>
              <Badge variant="secondary" className="text-xs">Residuel</Badge>
              <span className="font-bold text-sm min-w-[100px] text-right text-muted-foreground">
                {formatFCFA(decomposition.residual_amount)}
              </span>
              <span className="text-xs text-muted-foreground min-w-[40px] text-right">{decomposition.residual_pct}%</span>
              <span className="text-xs text-muted-foreground min-w-[60px] text-right" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

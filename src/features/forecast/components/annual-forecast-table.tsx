'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle, Info, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// TYPES
// ============================================================================

export type CellStatus = 'past_closed' | 'current_partial' | 'future_forecast';
export type AlertLevel = 'ok' | 'warning' | 'critical' | null;
export type RowType = 'income' | 'expense' | 'capex' | 'debt' | 'treasury' | 'total' | 'position';
export type ViewMode = 'budget_forecast' | 'budget_forecast_realized' | 'budget_only' | 'forecast_only';

export interface TableCell {
  month: number;
  budget: number;
  forecast: number;
  realized: number | null;
  status: CellStatus;
  alert_level: AlertLevel;
  model?: string;
  confidence?: number;
  is_locked?: boolean;
  note?: string;
}

export interface TableRow {
  id: string;
  parentId: string | null;
  level: 0 | 1 | 2 | 3;
  type: RowType;
  label: string;
  collapsible: boolean;
  defaultCollapsed: boolean;
  sortOrder: number;
  cells: TableCell[];
  children?: TableRow[];
}

interface AnnualForecastTableProps {
  rows: TableRow[];
  currentMonth: number; // 1-12
  viewMode: ViewMode;
  showVariance: boolean;
  highlightThreshold: number; // ecart % pour mise en evidence
  onCellEdit?: (rowId: string, month: number, value: number) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// HELPERS
// ============================================================================

function formatAmount(centimes: number): string {
  const amount = centimes / 100;
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function formatFull(centimes: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(centimes / 100) + ' FCFA';
}

function variance(actual: number, reference: number): number | null {
  if (reference === 0) return null;
  return ((actual - reference) / Math.abs(reference)) * 100;
}

function varianceColor(pct: number | null, isIncome: boolean): string {
  if (pct === null) return '';
  // For income: positive = good. For expense: negative = good.
  const favorable = isIncome ? pct > 0 : pct < 0;
  const absPct = Math.abs(pct);
  if (absPct <= 5) return '';
  if (favorable) return 'text-green-600';
  if (absPct <= 15) return 'text-orange-500';
  return 'text-red-600';
}

function cellBg(status: CellStatus): string {
  if (status === 'past_closed') return '';
  if (status === 'current_partial') return 'bg-blue-50/50';
  return 'bg-gray-50/50';
}

function alertIcon(level: AlertLevel) {
  if (level === 'critical') return <AlertTriangle className="h-3 w-3 text-red-600" />;
  if (level === 'warning') return <AlertTriangle className="h-3 w-3 text-orange-500" />;
  if (level === 'ok') return <CheckCircle className="h-3 w-3 text-green-600" />;
  return null;
}

// ============================================================================
// ROW COMPONENT
// ============================================================================

function ForecastRow({
  row,
  depth,
  expanded,
  onToggle,
  viewMode,
  showVariance,
  highlightThreshold,
  currentMonth,
}: {
  row: TableRow;
  depth: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  viewMode: ViewMode;
  showVariance: boolean;
  highlightThreshold: number;
  currentMonth: number;
}) {
  const isTotal = row.type === 'total';
  const isPosition = row.type === 'position';
  const isIncome = row.type === 'income';

  // Compute annual totals
  const annualBudget = row.cells.reduce((s, c) => s + c.budget, 0);
  const annualForecast = row.cells.reduce((s, c) => s + c.forecast, 0);
  const rowClasses = cn(
    'group border-b transition-colors hover:bg-muted/30',
    isTotal && 'font-semibold bg-muted/20',
    isPosition && 'font-bold bg-primary/5',
    row.level === 0 && 'font-bold border-t-2 border-b-2 bg-muted/40',
    row.level === 3 && 'text-muted-foreground',
  );

  const paddingLeft = 12 + depth * 20;

  return (
    <tr className={rowClasses}>
      {/* Label column (frozen) */}
      <td
        className="sticky left-0 z-10 bg-inherit border-r px-2 py-1.5 whitespace-nowrap"
        style={{ paddingLeft }}
      >
        <div className="flex items-center gap-1.5">
          {row.collapsible ? (
            <button
              onClick={() => onToggle(row.id)}
              className="p-0.5 rounded hover:bg-muted transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className={cn('text-xs truncate max-w-[200px]', row.level <= 1 && 'text-sm')}>
            {row.label}
          </span>
          {row.cells.some(c => c.alert_level && c.alert_level !== 'ok') && (
            <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" />
          )}
        </div>
      </td>

      {/* Monthly cells */}
      {row.cells.map((cell, mi) => {
        const isPast = mi + 1 < currentMonth;
        const vPB = variance(cell.forecast, cell.budget);

        return (
          <TooltipProvider key={mi} delayDuration={200}>
            <UITooltip>
              <TooltipTrigger asChild>
                <td
                  className={cn(
                    'border-r px-1 py-1 text-right text-xs tabular-nums whitespace-nowrap min-w-[70px]',
                    cellBg(cell.status),
                    cell.alert_level === 'critical' && 'bg-red-50',
                    cell.is_locked && 'bg-yellow-50/50',
                  )}
                >
                  <div className="flex flex-col items-end gap-0">
                    {/* Budget line */}
                    {(viewMode === 'budget_only' || viewMode === 'budget_forecast' || viewMode === 'budget_forecast_realized') && (
                      <span className="text-muted-foreground/60 text-[10px] leading-none">
                        {formatAmount(cell.budget)}
                      </span>
                    )}

                    {/* Forecast / Realized line */}
                    {viewMode !== 'budget_only' && (
                      <span className={cn(
                        'font-medium leading-tight',
                        isPast && cell.realized !== null ? '' : 'text-blue-700',
                        vPB !== null && Math.abs(vPB) > highlightThreshold && varianceColor(vPB, isIncome),
                      )}>
                        {isPast && cell.realized !== null
                          ? formatAmount(cell.realized)
                          : formatAmount(cell.forecast)}
                      </span>
                    )}

                    {/* Variance badge */}
                    {showVariance && vPB !== null && Math.abs(vPB) > 2 && (
                      <span className={cn('text-[9px] leading-none', varianceColor(vPB, isIncome))}>
                        {vPB > 0 ? '+' : ''}{vPB.toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Indicators */}
                  <div className="flex items-center gap-0.5 justify-end mt-0.5">
                    {cell.is_locked && <Lock className="h-2.5 w-2.5 text-yellow-600" />}
                    {cell.note && <Info className="h-2.5 w-2.5 text-blue-500" />}
                    {alertIcon(cell.alert_level)}
                  </div>
                </td>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{row.label} — {MONTHS[mi]} 2026</p>
                  <div className="grid grid-cols-2 gap-x-3">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="text-right">{formatFull(cell.budget)}</span>
                    <span className="text-muted-foreground">Prevision</span>
                    <span className="text-right">{formatFull(cell.forecast)}</span>
                    {cell.realized !== null && (
                      <>
                        <span className="text-muted-foreground">Realise</span>
                        <span className="text-right">{formatFull(cell.realized)}</span>
                      </>
                    )}
                    {vPB !== null && (
                      <>
                        <span className="text-muted-foreground">Ecart P/B</span>
                        <span className={cn('text-right', varianceColor(vPB, isIncome))}>
                          {vPB > 0 ? '+' : ''}{vPB.toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                  {cell.model && (
                    <p className="text-muted-foreground">Modele: {cell.model} — Confiance: {Math.round((cell.confidence ?? 0) * 100)}%</p>
                  )}
                  {cell.note && <p className="text-blue-600 italic">{cell.note}</p>}
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        );
      })}

      {/* Annual total column (frozen right) */}
      <td className="sticky right-0 z-10 bg-inherit border-l-2 px-2 py-1.5 text-right text-xs tabular-nums font-semibold">
        <div className="flex flex-col items-end">
          {(viewMode === 'budget_only' || viewMode === 'budget_forecast' || viewMode === 'budget_forecast_realized') && (
            <span className="text-muted-foreground/60 text-[10px]">{formatAmount(annualBudget)}</span>
          )}
          {viewMode !== 'budget_only' && (
            <span className={cn(
              variance(annualForecast, annualBudget) !== null &&
              Math.abs(variance(annualForecast, annualBudget)!) > highlightThreshold &&
              varianceColor(variance(annualForecast, annualBudget), isIncome)
            )}>
              {formatAmount(annualForecast)}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// MAIN TABLE COMPONENT
// ============================================================================

export function AnnualForecastTable({
  rows,
  currentMonth,
  viewMode,
  showVariance,
  highlightThreshold,
}: AnnualForecastTableProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    // Default: collapse all rows that have defaultCollapsed = true
    const ids = new Set<string>();
    function walk(items: TableRow[]) {
      for (const row of items) {
        if (row.defaultCollapsed) ids.add(row.id);
        if (row.children) walk(row.children);
      }
    }
    walk(rows);
    return ids;
  });

  const toggleRow = useCallback((id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => setCollapsedIds(new Set());
  const collapseAll = () => {
    const ids = new Set<string>();
    function walk(items: TableRow[]) {
      for (const row of items) {
        if (row.collapsible) ids.add(row.id);
        if (row.children) walk(row.children);
      }
    }
    walk(rows);
    setCollapsedIds(ids);
  };

  // Flatten visible rows
  const visibleRows = useMemo(() => {
    const result: { row: TableRow; depth: number; expanded: boolean }[] = [];
    function walk(items: TableRow[], depth: number) {
      for (const row of items) {
        const isExpanded = !collapsedIds.has(row.id);
        result.push({ row, depth, expanded: isExpanded });
        if (isExpanded && row.children) {
          walk(row.children, depth + 1);
        }
      }
    }
    walk(rows, 0);
    return result;
  }, [rows, collapsedIds]);

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center gap-2 text-xs">
        <button onClick={expandAll} className="px-2 py-1 rounded border hover:bg-muted transition-colors">
          Tout developper
        </button>
        <button onClick={collapseAll} className="px-2 py-1 rounded border hover:bg-muted transition-colors">
          Tout reduire
        </button>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[10px]">
          {viewMode === 'budget_forecast' ? 'Budget + Prevision' :
           viewMode === 'budget_forecast_realized' ? 'Budget + Prevision + Realise' :
           viewMode === 'budget_only' ? 'Budget seul' : 'Prevision seule'}
        </Badge>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20 bg-muted/80 backdrop-blur">
            <tr>
              <th className="sticky left-0 z-30 bg-muted/90 border-r px-3 py-2 text-left text-xs font-semibold w-[280px] min-w-[200px]">
                Libelle
              </th>
              {MONTHS.map((m, i) => (
                <th
                  key={m}
                  className={cn(
                    'border-r px-1 py-2 text-center text-xs font-semibold min-w-[70px]',
                    i + 1 === currentMonth && 'bg-blue-100/50 border-b-2 border-b-blue-500',
                    i + 1 < currentMonth && 'text-muted-foreground',
                  )}
                >
                  {m}
                </th>
              ))}
              <th className="sticky right-0 z-30 bg-muted/90 border-l-2 px-3 py-2 text-center text-xs font-semibold min-w-[80px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ row, depth, expanded }) => (
              <ForecastRow
                key={row.id}
                row={row}
                depth={depth}
                expanded={expanded}
                onToggle={toggleRow}
                viewMode={viewMode}
                showVariance={showVariance}
                highlightThreshold={highlightThreshold}
                currentMonth={currentMonth}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

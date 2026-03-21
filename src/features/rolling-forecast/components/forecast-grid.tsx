import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ForecastColumn, ForecastRow } from '../types';

interface ForecastGridProps {
  title: string;
  columns: ForecastColumn[];
  rows: ForecastRow[];
  showConfidence: boolean;
}

function formatFCFA(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toLocaleString('fr-FR');
}

function confidenceColor(pct: number): string {
  if (pct >= 95) return 'bg-green-500';
  if (pct >= 80) return 'bg-blue-500';
  if (pct >= 65) return 'bg-orange-400';
  return 'bg-gray-400';
}

function columnBgClass(col: ForecastColumn): string {
  if (col.is_past) return 'bg-white dark:bg-zinc-900';
  if (col.is_current) return 'bg-blue-50 dark:bg-blue-950/30';
  if (col.confidence_pct >= 90) return 'bg-gray-50/50 dark:bg-zinc-800/30';
  if (col.confidence_pct >= 80) return 'bg-gray-100/50 dark:bg-zinc-800/50';
  return 'bg-gray-100 dark:bg-zinc-800/70';
}

export function ForecastGrid({ title, columns, rows, showConfidence }: ForecastGridProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  // Determine visible rows based on expanded state
  const visibleRows = rows.filter((row) => {
    if (row.level === 0) return true;
    // Show child rows only if parent is expanded
    return row.parent_code ? expanded.has(row.parent_code) : true;
  });

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-semibold min-w-[220px]">
                Libellé
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-2 py-2 text-right font-medium min-w-[100px]',
                    columnBgClass(col),
                  )}
                >
                  <div>{col.key}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    {col.label}
                  </div>
                </th>
              ))}
              <th className="px-2 py-2 text-right font-semibold min-w-[100px] bg-muted/80">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.code}
                className={cn(
                  'border-b last:border-b-0 transition-colors',
                  row.is_total && 'bg-muted/30 border-t-2',
                  row.level === 1 && 'bg-muted/10',
                )}
              >
                {/* Label cell */}
                <td
                  className={cn(
                    'sticky left-0 z-10 bg-card px-3 py-1.5 whitespace-nowrap',
                    row.is_total && 'font-bold bg-muted/30',
                    row.level === 1 && 'bg-muted/10',
                  )}
                  style={{ paddingLeft: `${12 + row.level * 16}px` }}
                >
                  <div className="flex items-center gap-1">
                    {row.is_expandable && (
                      <button
                        type="button"
                        className="p-0.5 rounded hover:bg-accent"
                        onClick={() => toggleExpand(row.code)}
                      >
                        {expanded.has(row.code) ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <span className={cn(row.is_total && 'font-bold')}>
                      {row.label}
                    </span>
                  </div>
                </td>

                {/* Data cells */}
                {columns.map((col) => {
                  const c = row.cells[col.key];
                  if (!c) {
                    return (
                      <td key={col.key} className={cn('px-2 py-1.5 text-right', columnBgClass(col))}>
                        -
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-2 py-1.5 text-right tabular-nums',
                        columnBgClass(col),
                        row.is_total && 'font-bold',
                      )}
                    >
                      <div>{formatFCFA(c.forecast)}</div>
                      {showConfidence && c.low_80 !== undefined && c.high_80 !== undefined && (
                        <div className="text-[9px] text-muted-foreground">
                          {formatFCFA(c.low_80)} – {formatFCFA(c.high_80)}
                        </div>
                      )}
                    </td>
                  );
                })}

                {/* Total cell */}
                <td
                  className={cn(
                    'px-2 py-1.5 text-right tabular-nums font-semibold bg-muted/20',
                    row.is_total && 'font-bold',
                  )}
                >
                  {formatFCFA(row.total.forecast)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Confidence footer */}
          <tfoot>
            <tr className="border-t">
              <td className="sticky left-0 z-10 bg-card px-3 py-1.5 text-[10px] text-muted-foreground font-medium">
                Confiance
              </td>
              {columns.map((col) => (
                <td key={col.key} className="px-2 py-1.5">
                  <div className="flex items-center justify-end gap-1">
                    <div
                      className={cn('h-1.5 rounded-full', confidenceColor(col.confidence_pct))}
                      style={{ width: `${col.confidence_pct * 0.6}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {col.confidence_pct}%
                    </span>
                  </div>
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

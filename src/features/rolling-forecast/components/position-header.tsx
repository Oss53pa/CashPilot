import { cn } from '@/lib/utils';
import type { ForecastColumn, PositionBlock } from '../types';

interface PositionHeaderProps {
  columns: ForecastColumn[];
  position: PositionBlock;
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

export function PositionHeader({ columns, position, showConfidence }: PositionHeaderProps) {
  const rows = [
    { label: 'Position début de période', key: 'opening' as const, bold: false },
    { label: 'Flux net de la période', key: 'net_flow' as const, bold: false },
    { label: 'Position fin de période', key: 'closing' as const, bold: true },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-semibold min-w-[220px]">
              Position de trésorerie
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-2 py-2 text-right font-medium min-w-[100px]',
                  col.is_current && 'bg-blue-50 dark:bg-blue-950/30',
                )}
              >
                {col.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b last:border-b-0">
              <td
                className={cn(
                  'sticky left-0 z-10 bg-card px-3 py-1.5',
                  row.bold && 'font-bold',
                )}
              >
                {row.label}
              </td>
              {columns.map((col) => {
                const val = position.columns[col.key]?.[row.key] ?? 0;
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-2 py-1.5 text-right tabular-nums',
                      row.bold && 'font-bold',
                      col.is_current && 'bg-blue-50/50 dark:bg-blue-950/20',
                      row.key === 'net_flow' && val > 0 && 'text-green-600',
                      row.key === 'net_flow' && val < 0 && 'text-red-600',
                    )}
                  >
                    {formatFCFA(val)}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Threshold separator */}
          <tr className="border-b-2 border-dashed border-red-400">
            <td className="sticky left-0 z-10 bg-card px-3 py-1 text-red-600 font-medium">
              Seuil minimum 50M FCFA
            </td>
            {columns.map((col) => (
              <td key={col.key} className="px-2 py-1 text-right text-red-500 tabular-nums">
                50.0M
              </td>
            ))}
          </tr>

          {/* Surplus / Deficit */}
          <tr className="border-b">
            <td className="sticky left-0 z-10 bg-card px-3 py-1.5 font-medium">
              Excédent / (Déficit) vs seuil
            </td>
            {columns.map((col) => {
              const val = position.columns[col.key]?.surplus_deficit ?? 0;
              return (
                <td
                  key={col.key}
                  className={cn(
                    'px-2 py-1.5 text-right font-semibold tabular-nums',
                    val >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {val < 0 && '('}
                  {formatFCFA(Math.abs(val))}
                  {val < 0 && ')'}
                </td>
              );
            })}
          </tr>

          {/* Optimistic / Pessimistic (conditional) */}
          {showConfidence && (
            <>
              <tr className="border-b">
                <td className="sticky left-0 z-10 bg-card px-3 py-1.5 text-muted-foreground italic">
                  Position optimiste
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                    {formatFCFA(position.columns[col.key]?.optimistic ?? 0)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-card px-3 py-1.5 text-muted-foreground italic">
                  Position pessimiste
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                    {formatFCFA(position.columns[col.key]?.pessimistic ?? 0)}
                  </td>
                ))}
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

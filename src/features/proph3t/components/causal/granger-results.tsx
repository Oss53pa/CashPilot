import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GrangerCausalityResult } from './causal-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pValueBadge(pValue: number, isSignificant: boolean) {
  if (pValue < 0.01) return <Badge variant="success" className="text-xs">p &lt; 0.01</Badge>;
  if (pValue < 0.05) return <Badge variant="success" className="text-xs">p &lt; 0.05</Badge>;
  if (pValue < 0.1) return <Badge variant="warning" className="text-xs">p &lt; 0.10</Badge>;
  return <Badge variant="secondary" className="text-xs">p = {pValue.toFixed(3)}</Badge>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface GrangerResultsProps {
  results: GrangerCausalityResult[];
}

export function GrangerResults({ results }: GrangerResultsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tests de causalite de Granger</CardTitle>
        <CardDescription>
          Resultats des tests statistiques de causalite temporelle entre variables financieres
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-center px-4 py-3 font-medium" />
                <th className="text-left px-4 py-3 font-medium">Cible</th>
                <th className="text-center px-4 py-3 font-medium">Delai</th>
                <th className="text-center px-4 py-3 font-medium">p-value</th>
                <th className="text-center px-4 py-3 font-medium">Significatif</th>
                <th className="text-left px-4 py-3 font-medium">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.source}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{'\u2192'}</td>
                  <td className="px-4 py-3 font-medium">{r.target}</td>
                  <td className="px-4 py-3 text-center">
                    {r.lag_days > 0 ? (
                      <Badge variant="outline" className="text-xs">{r.lag_days}j</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">immed.</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pValueBadge(r.p_value, r.is_significant)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.is_significant ? (
                      <span className="text-green-600 font-semibold text-xs">Oui</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Non</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

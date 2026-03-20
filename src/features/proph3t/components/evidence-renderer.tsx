import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatAmount } from '@/lib/format';

interface EvidenceRendererProps {
  evidence: Record<string, unknown>;
  className?: string;
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') {
    if (key.includes('amount') || key.includes('threshold') || key.includes('balance')) {
      return formatAmount(value / 100, 'XOF');
    }
    return value.toLocaleString('fr-FR');
  }
  if (typeof value === 'string') {
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return value;
  }
  if (Array.isArray(value)) return `${value.length} élément(s)`;
  return JSON.stringify(value);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function EvidenceRenderer({ evidence, className }: EvidenceRendererProps) {
  const entries = Object.entries(evidence).filter(
    ([, v]) => v !== null && v !== undefined && !Array.isArray(v) && typeof v !== 'object'
  );
  const arrayEntries = Object.entries(evidence).filter(
    ([, v]) => Array.isArray(v)
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Preuves</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{humanizeKey(key)}</span>
                <span className="text-sm font-medium">{formatValue(key, value)}</span>
              </div>
            ))}
          </div>

          {arrayEntries.map(([key, items]) => (
            <div key={key} className="mt-4">
              <span className="text-xs text-muted-foreground">{humanizeKey(key)}</span>
              <div className="mt-1 space-y-1">
                {(items as Record<string, unknown>[]).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                    {Object.entries(item).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="text-xs">
                        {humanizeKey(k)}: {formatValue(k, v)}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

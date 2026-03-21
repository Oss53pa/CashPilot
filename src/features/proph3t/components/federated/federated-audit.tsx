import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FederatedAuditEntry } from './federated-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTION_LABELS: Record<FederatedAuditEntry['action'], string> = {
  parameters_shared: 'Parametres partages',
  global_model_received: 'Modele global recu',
  opted_in: 'Opt-in',
  opted_out: 'Opt-out',
};

const ACTION_VARIANTS: Record<FederatedAuditEntry['action'], 'default' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  parameters_shared: 'default',
  global_model_received: 'success',
  opted_in: 'success',
  opted_out: 'warning',
};

type FilterAction = FederatedAuditEntry['action'] | 'all';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FederatedAuditProps {
  entries: FederatedAuditEntry[];
}

export function FederatedAudit({ entries }: FederatedAuditProps) {
  const [filter, setFilter] = useState<FilterAction>('all');

  const filteredEntries = filter === 'all' ? entries : entries.filter((e) => e.action === filter);

  const filterOptions: { value: FilterAction; label: string }[] = [
    { value: 'all', label: 'Tout' },
    { value: 'parameters_shared', label: 'Partages' },
    { value: 'global_model_received', label: 'Receptions' },
    { value: 'opted_in', label: 'Opt-in' },
    { value: 'opted_out', label: 'Opt-out' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Journal d'audit</CardTitle>
        <CardDescription>Historique complet des echanges avec le reseau federe</CardDescription>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Type modele</th>
                <th className="text-center px-4 py-3 font-medium">Parametres</th>
                <th className="text-center px-4 py-3 font-medium">Bruit DP</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ACTION_VARIANTS[entry.action]} className="text-xs">
                      {ACTION_LABELS[entry.action]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{entry.model_type}</td>
                  <td className="px-4 py-3 text-center">
                    {entry.parameters_count > 0 ? (
                      <span className="text-xs font-mono">{entry.parameters_count.toLocaleString('fr-FR')}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.dp_noise_level > 0 ? (
                      <Badge variant="outline" className="text-xs font-mono">
                        {'\u03B5'}={entry.dp_noise_level}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

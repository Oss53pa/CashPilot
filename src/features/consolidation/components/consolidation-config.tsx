import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ConsolidationConfig } from '../services/consolidation.service';

interface ConsolidationConfigProps {
  config: ConsolidationConfig | undefined;
  isLoading?: boolean;
  onUpdate?: (data: Partial<ConsolidationConfig>) => void;
}

export function ConsolidationConfigPanel({ config, isLoading, onUpdate }: ConsolidationConfigProps) {
  const [currency, setCurrency] = useState(config?.consolidation_currency ?? 'XOF');

  if (isLoading || !config) {
    return (
      <Card>
        <CardHeader><CardTitle>Configuration Consolidation</CardTitle></CardHeader>
        <CardContent><div className="h-32 animate-pulse rounded bg-muted" /></CardContent>
      </Card>
    );
  }

  const handleToggleCompany = (companyId: string) => {
    const updated = config.included_companies.map((c) =>
      c.id === companyId ? { ...c, included: !c.included } : c,
    );
    onUpdate?.({ included_companies: updated });
  };

  return (
    <div className="space-y-4">
      {/* Currency Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Devise de Consolidation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              onUpdate?.({ consolidation_currency: e.target.value });
            }}
          >
            <option value="XOF">XOF (Franc CFA BCEAO)</option>
            <option value="XAF">XAF (Franc CFA BEAC)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="USD">USD (Dollar US)</option>
          </select>
          <Badge variant="outline">
            Methode: {config.elimination_method === 'full' ? 'Elimination integrale' : 'Proportionnelle'}
          </Badge>
        </CardContent>
      </Card>

      {/* Companies Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Entites Incluses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entite</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.included_companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={company.included ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      variant="outline"
                    >
                      {company.included ? 'Incluse' : 'Exclue'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleCompany(company.id)}
                    >
                      {company.included ? 'Exclure' : 'Inclure'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Intercompany Pairs */}
      <Card>
        <CardHeader>
          <CardTitle>Paires Intragroupe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>De</TableHead>
                <TableHead>Vers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.intercompany_pairs.map((pair, idx) => (
                <TableRow key={idx}>
                  <TableCell>{pair.from_company_name}</TableCell>
                  <TableCell>{pair.to_company_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { EliminatedFlow } from '../services/consolidation.service';

interface EliminationViewProps {
  flows: EliminatedFlow[];
  isLoading?: boolean;
}

const statusVariant: Record<string, string> = {
  eliminated: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
};

export function EliminationView({ flows, isLoading }: EliminationViewProps) {
  const totalEliminated = flows
    .filter((f) => f.elimination_status === 'eliminated')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPending = flows
    .filter((f) => f.elimination_status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  // Net impact verification: paired eliminated flows should net to 0
  // For each direction pair, check if reciprocal exists
  const netImpact = flows
    .filter((f) => f.elimination_status === 'eliminated')
    .reduce((sum, f) => {
      // find reciprocal
      const reciprocal = flows.find(
        (r) =>
          r.from_company === f.to_company &&
          r.to_company === f.from_company &&
          r.elimination_status === 'eliminated',
      );
      return reciprocal ? sum : sum + f.amount;
    }, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Eliminations Intragroupe</CardTitle></CardHeader>
        <CardContent><div className="h-32 animate-pulse rounded bg-muted" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Elimine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={totalEliminated} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              <CurrencyDisplay amount={totalPending} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impact Net (verification)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netImpact === 0 ? 'text-green-600' : 'text-red-600'}`}>
              <CurrencyDisplay amount={netImpact} currency="XOF" />
              {netImpact === 0 && <span className="block text-xs text-green-600 mt-1">Equilibre verifie</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail des Flux Elimines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>De</TableHead>
                <TableHead>Vers</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Nature</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell className="font-medium">{flow.from_company}</TableCell>
                  <TableCell>{flow.to_company}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={flow.amount} currency="XOF" />
                  </TableCell>
                  <TableCell>{flow.nature}</TableCell>
                  <TableCell>
                    <Badge className={statusVariant[flow.elimination_status] ?? ''} variant="outline">
                      {flow.elimination_status === 'eliminated' ? 'Elimine' :
                       flow.elimination_status === 'pending' ? 'En attente' : 'Partiel'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

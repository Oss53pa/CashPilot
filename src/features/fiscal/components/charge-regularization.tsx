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
import type { ChargeRegularization } from '../types';

interface ChargeRegularizationTableProps {
  regularizations: ChargeRegularization[];
  isLoading?: boolean;
}

const statusVariant: Record<string, string> = {
  regularized: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  disputed: 'bg-red-100 text-red-800',
};

export function ChargeRegularizationTable({ regularizations, isLoading }: ChargeRegularizationTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regularisation des Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regularisation des Charges</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercice Fiscal</TableHead>
              <TableHead className="text-right">Charges Reelles</TableHead>
              <TableHead className="text-right">Provisions Appelees</TableHead>
              <TableHead className="text-right">Solde</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regularizations.map((reg) => {
              const action = reg.balance > 0
                ? 'Appel supplementaire'
                : reg.balance < 0
                ? 'Remboursement'
                : 'Equilibre';

              return (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{reg.fiscal_year}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={reg.actual_charges} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={reg.called_provisions} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={reg.balance > 0 ? 'text-red-600' : reg.balance < 0 ? 'text-green-600' : ''}>
                      <CurrencyDisplay amount={Math.abs(reg.balance)} currency="XOF" />
                      {reg.balance < 0 ? ' (credit)' : reg.balance > 0 ? ' (debit)' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={
                      reg.balance > 0
                        ? 'text-red-600 font-medium'
                        : reg.balance < 0
                        ? 'text-green-600 font-medium'
                        : 'text-muted-foreground'
                    }>
                      {action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusVariant[reg.status] ?? ''} variant="outline">
                      {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

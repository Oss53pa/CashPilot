import { useMemo } from 'react';
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
import type { VATFlow } from '../types';

interface VATFlowTableProps {
  flows: VATFlow[];
  isLoading?: boolean;
}

const statusVariant: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  declared: 'bg-blue-100 text-blue-800',
  pending: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800',
};

export function VATFlowTable({ flows, isLoading }: VATFlowTableProps) {
  const summary = useMemo(() => {
    const totalCollected = flows.reduce((s, f) => s + f.vat_collected, 0);
    const totalDeductible = flows.reduce((s, f) => s + f.vat_deductible, 0);
    const totalPaid = flows.filter((f) => f.status === 'paid').reduce((s, f) => s + f.vat_due, 0);
    const outstanding = flows.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.vat_due, 0);
    return { totalCollected, totalDeductible, totalPaid, outstanding };
  }, [flows]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>TVA - Flux mensuels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              TVA Collectee YTD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={summary.totalCollected} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              TVA Deductible YTD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={summary.totalDeductible} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paye YTD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={summary.totalPaid} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde Restant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <CurrencyDisplay amount={summary.outstanding} currency="XOF" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Table */}
      <Card>
        <CardHeader>
          <CardTitle>TVA - Flux mensuels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">TVA Collectee</TableHead>
                <TableHead className="text-right">TVA Deductible</TableHead>
                <TableHead className="text-right">TVA Nette Due</TableHead>
                <TableHead>Date Paiement</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell className="font-medium">{flow.period}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={flow.vat_collected} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={flow.vat_deductible} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <CurrencyDisplay amount={flow.vat_collected - flow.vat_deductible} currency="XOF" />
                  </TableCell>
                  <TableCell>
                    {flow.payment_date
                      ? new Date(flow.payment_date).toLocaleDateString('fr-FR')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusVariant[flow.status] ?? ''} variant="outline">
                      {flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
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

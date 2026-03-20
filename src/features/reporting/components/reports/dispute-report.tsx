import { useTranslation } from 'react-i18next';
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
import { formatDate } from '@/lib/utils';

interface DisputeRow {
  reference: string;
  debtor: string;
  amount: number;
  provision: number;
  status: 'open' | 'in_progress' | 'settled' | 'closed';
  next_hearing: string | null;
}

const MOCK_DATA: DisputeRow[] = [
  { reference: 'LIT-2025-001', debtor: 'CFAO Motors', amount: 28_200_000, provision: 14_100_000, status: 'in_progress', next_hearing: '2026-04-15' },
  { reference: 'LIT-2025-002', debtor: 'Société Générale CI', amount: 15_600_000, provision: 7_800_000, status: 'open', next_hearing: '2026-05-22' },
  { reference: 'LIT-2024-008', debtor: 'Transport Abidjan', amount: 8_400_000, provision: 8_400_000, status: 'in_progress', next_hearing: '2026-04-03' },
  { reference: 'LIT-2025-003', debtor: 'Maersk Dakar', amount: 42_000_000, provision: 21_000_000, status: 'open', next_hearing: null },
  { reference: 'LIT-2024-012', debtor: 'BTP Construction', amount: 6_750_000, provision: 3_375_000, status: 'settled', next_hearing: null },
];

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'success'> = {
  open: 'destructive',
  in_progress: 'default',
  settled: 'success',
  closed: 'secondary',
};

export function DisputeReport() {
  const { t } = useTranslation();

  const activeDisputes = MOCK_DATA.filter((d) => d.status !== 'settled' && d.status !== 'closed');
  const totalLitigated = activeDisputes.reduce((s, d) => s + d.amount, 0);
  const totalProvisions = activeDisputes.reduce((s, d) => s + d.provision, 0);
  const expectedNetValue = totalLitigated - totalProvisions;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.activeDisputes', 'Active Disputes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDisputes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              {t('reports.totalLitigated', 'Total Litigated')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <CurrencyDisplay amount={totalLitigated} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              {t('reports.totalProvisions', 'Total Provisions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              <CurrencyDisplay amount={totalProvisions} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.expectedNetValue', 'Expected Net Value')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={expectedNetValue} currency="XOF" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.disputeFiles', 'Active Dispute Files')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.reference', 'Reference')}</TableHead>
                <TableHead>{t('reports.debtor', 'Debtor')}</TableHead>
                <TableHead className="text-right">
                  {t('reports.amount', 'Amount')}
                </TableHead>
                <TableHead className="text-right">
                  {t('reports.provision', 'Provision')}
                </TableHead>
                <TableHead>{t('reports.status', 'Status')}</TableHead>
                <TableHead>{t('reports.nextHearing', 'Next Hearing')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm font-medium">
                    {row.reference}
                  </TableCell>
                  <TableCell>{row.debtor}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.amount} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.provision} currency="XOF" />
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[row.status]}>
                      {row.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.next_hearing ? formatDate(row.next_hearing) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {MOCK_DATA.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t('reports.noData', 'No data available')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

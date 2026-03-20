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
import { Progress } from '@/components/ui/progress';
import { CurrencyDisplay } from '@/components/shared/currency-display';

interface CapexRow {
  code: string;
  name: string;
  budget: number;
  committed: number;
  invoiced: number;
  disbursed: number;
  remaining: number;
}

const MOCK_DATA: CapexRow[] = [
  { code: 'CAPEX-001', name: 'Fleet renewal — delivery trucks', budget: 180_000_000, committed: 135_000_000, invoiced: 120_000_000, disbursed: 90_000_000, remaining: 90_000_000 },
  { code: 'CAPEX-002', name: 'IT infrastructure upgrade', budget: 45_000_000, committed: 42_000_000, invoiced: 38_500_000, disbursed: 38_500_000, remaining: 6_500_000 },
  { code: 'CAPEX-003', name: 'Warehouse extension Dakar', budget: 320_000_000, committed: 185_000_000, invoiced: 160_000_000, disbursed: 145_000_000, remaining: 175_000_000 },
  { code: 'CAPEX-004', name: 'Solar panel installation', budget: 75_000_000, committed: 75_000_000, invoiced: 72_000_000, disbursed: 72_000_000, remaining: 3_000_000 },
  { code: 'CAPEX-005', name: 'Office renovation Abidjan', budget: 28_000_000, committed: 12_000_000, invoiced: 8_500_000, disbursed: 8_500_000, remaining: 19_500_000 },
];

export function CapexReport() {
  const { t } = useTranslation();

  const totals = MOCK_DATA.reduce(
    (acc, r) => ({
      budget: acc.budget + r.budget,
      committed: acc.committed + r.committed,
      invoiced: acc.invoiced + r.invoiced,
      disbursed: acc.disbursed + r.disbursed,
      remaining: acc.remaining + r.remaining,
    }),
    { budget: 0, committed: 0, invoiced: 0, disbursed: 0, remaining: 0 },
  );

  const globalProgress = totals.budget > 0
    ? Math.round((totals.disbursed / totals.budget) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.totalBudget', 'Total Budget')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={totals.budget} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.totalCommitted', 'Total Committed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={totals.committed} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.totalDisbursed', 'Total Disbursed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={totals.disbursed} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.globalProgress', 'Global Progress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalProgress}%</div>
            <Progress value={globalProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* CAPEX table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reports.capexOperations', 'CAPEX Operations')}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>{t('reports.operationName', 'Operation')}</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Committed</TableHead>
                <TableHead className="text-right">Invoiced</TableHead>
                <TableHead className="text-right">Disbursed</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="w-[120px]">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map((row, idx) => {
                const progress = row.budget > 0
                  ? Math.round((row.disbursed / row.budget) * 100)
                  : 0;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.budget} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.committed} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.invoiced} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.disbursed} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.remaining} currency="XOF" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="flex-1" />
                        <span className="text-xs text-muted-foreground w-[36px] text-right">
                          {progress}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-t-2 font-bold bg-muted/50">
                <TableCell colSpan={2}>TOTAL</TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={totals.budget} currency="XOF" />
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={totals.committed} currency="XOF" />
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={totals.invoiced} currency="XOF" />
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={totals.disbursed} currency="XOF" />
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={totals.remaining} currency="XOF" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={globalProgress} className="flex-1" />
                    <span className="text-xs text-muted-foreground w-[36px] text-right">
                      {globalProgress}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

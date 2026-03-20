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
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { TreasuryLineChart } from '@/components/charts/treasury-line-chart';

interface BankPositionRow {
  account: string;
  bank: string;
  opening: number;
  receipts: number;
  disbursements: number;
  closing: number;
  fees: number;
}

const MOCK_DATA: BankPositionRow[] = [
  { account: 'Compte courant XOF', bank: 'SGBCI', opening: 85_000_000, receipts: 62_500_000, disbursements: 48_200_000, closing: 99_300_000, fees: 185_000 },
  { account: 'Compte courant XOF', bank: 'Ecobank', opening: 42_000_000, receipts: 38_700_000, disbursements: 35_100_000, closing: 45_600_000, fees: 142_000 },
  { account: 'Compte épargne', bank: 'BOA', opening: 120_000_000, receipts: 15_000_000, disbursements: 0, closing: 135_000_000, fees: 0 },
  { account: 'Mobile Money Orange', bank: 'Orange Money', opening: 8_500_000, receipts: 12_300_000, disbursements: 11_800_000, closing: 9_000_000, fees: 245_000 },
  { account: 'Caisse principale', bank: 'Cash', opening: 3_200_000, receipts: 6_800_000, disbursements: 5_400_000, closing: 4_600_000, fees: 0 },
  { account: 'Compte USD', bank: 'SGBCI', opening: 15_000_000, receipts: 8_200_000, disbursements: 6_100_000, closing: 17_100_000, fees: 95_000 },
];

const MONTHLY_EVOLUTION = [
  { date: 'Oct', receipts: 125_000_000, disbursements: 98_000_000, net: 27_000_000 },
  { date: 'Nov', receipts: 132_000_000, disbursements: 115_000_000, net: 17_000_000 },
  { date: 'Dec', receipts: 148_000_000, disbursements: 135_000_000, net: 13_000_000 },
  { date: 'Jan', receipts: 118_000_000, disbursements: 102_000_000, net: 16_000_000 },
  { date: 'Feb', receipts: 138_000_000, disbursements: 108_000_000, net: 30_000_000 },
  { date: 'Mar', receipts: 143_500_000, disbursements: 106_600_000, net: 36_900_000 },
];

export function MultiBankReport() {
  const { t } = useTranslation();

  const totalFees = MOCK_DATA.reduce((s, r) => s + r.fees, 0);
  const totalOpening = MOCK_DATA.reduce((s, r) => s + r.opening, 0);
  const totalClosing = MOCK_DATA.reduce((s, r) => s + r.closing, 0);
  const totalReceipts = MOCK_DATA.reduce((s, r) => s + r.receipts, 0);
  const totalDisbursements = MOCK_DATA.reduce((s, r) => s + r.disbursements, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.totalBankPosition', 'Total Bank Position')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={totalClosing} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              {t('reports.totalReceipts', 'Total Receipts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <CurrencyDisplay amount={totalReceipts} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              {t('reports.totalDisbursements', 'Total Disbursements')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <CurrencyDisplay amount={totalDisbursements} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              {t('reports.totalBankFees', 'Total Bank Fees')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              <CurrencyDisplay amount={totalFees} currency="XOF" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position by account */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reports.positionByAccount', 'Position by Account')}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.account', 'Account')}</TableHead>
                <TableHead>{t('reports.bank', 'Bank')}</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Receipts</TableHead>
                <TableHead className="text-right">Disbursements</TableHead>
                <TableHead className="text-right">Closing</TableHead>
                <TableHead className="text-right">Fees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.account}</TableCell>
                  <TableCell>{row.bank}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.opening} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    <CurrencyDisplay amount={row.receipts} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    <CurrencyDisplay amount={row.disbursements} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyDisplay amount={row.closing} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    <CurrencyDisplay amount={row.fees} currency="XOF" />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-bold bg-muted/50">
                <TableCell colSpan={2}>TOTAL</TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={totalOpening} currency="XOF" />
                </TableCell>
                <TableCell className="text-right text-green-600">
                  <CurrencyDisplay amount={totalReceipts} currency="XOF" />
                </TableCell>
                <TableCell className="text-right text-red-600">
                  <CurrencyDisplay amount={totalDisbursements} currency="XOF" />
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={totalClosing} currency="XOF" />
                </TableCell>
                <TableCell className="text-right text-amber-600">
                  <CurrencyDisplay amount={totalFees} currency="XOF" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly evolution chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reports.monthlyEvolution', 'Monthly Evolution')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TreasuryLineChart data={MONTHLY_EVOLUTION} height={300} />
        </CardContent>
      </Card>
    </div>
  );
}

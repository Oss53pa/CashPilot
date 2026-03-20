import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import type { PriorReceivable } from '../types';

const NATURE_LABELS: Record<PriorReceivable['nature'], string> = {
  loyer: 'Loyer',
  charges: 'Charges',
  pas_de_porte: 'Pas-de-porte',
  autre: 'Autre',
};

const STATUS_COLORS: Record<PriorReceivable['status'], string> = {
  normal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  disputed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  irrecoverable: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface ReceivablesPortfolioProps {
  receivables: PriorReceivable[];
  onChange: (receivables: PriorReceivable[]) => void;
}

function createEmptyReceivable(): PriorReceivable {
  return {
    id: `recv-${Date.now()}`,
    counterparty: '',
    nature: 'autre',
    period: '',
    gross_amount: 0,
    recoverable_amount: 0,
    status: 'normal',
    expected_date: '',
    probability_pct: 100,
    notes: '',
  };
}

export function ReceivablesPortfolio({ receivables, onChange }: ReceivablesPortfolioProps) {
  const { t } = useTranslation('opening-balance');

  const totalGross = receivables.reduce((s, r) => s + r.gross_amount, 0);
  const totalRecoverable = receivables
    .filter((r) => r.status !== 'irrecoverable')
    .reduce((s, r) => s + r.recoverable_amount, 0);

  const byStatus = {
    normal: receivables.filter((r) => r.status === 'normal').length,
    late: receivables.filter((r) => r.status === 'late').length,
    disputed: receivables.filter((r) => r.status === 'disputed').length,
    irrecoverable: receivables.filter((r) => r.status === 'irrecoverable').length,
  };

  function addReceivable() {
    onChange([...receivables, createEmptyReceivable()]);
  }

  function removeReceivable(id: string) {
    onChange(receivables.filter((r) => r.id !== id));
  }

  function updateReceivable(id: string, field: keyof PriorReceivable, value: unknown) {
    onChange(
      receivables.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {t('receivables.title', 'Prior Receivables Portfolio')}
      </h3>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('receivables.total_gross', 'Total Gross')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalGross, 'XOF')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('receivables.total_recoverable', 'Total Recoverable')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalRecoverable, 'XOF')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('receivables.by_status', 'By Status')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xs">Normal: {byStatus.normal} | Late: {byStatus.late}</p>
            <p className="text-xs">Disputed: {byStatus.disputed} | Irrec.: {byStatus.irrecoverable}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('receivables.count', 'Total Entries')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{receivables.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">{t('receivables.counterparty', 'Counterparty')}</TableHead>
              <TableHead>{t('receivables.nature', 'Nature')}</TableHead>
              <TableHead>{t('receivables.period', 'Period')}</TableHead>
              <TableHead className="text-right">{t('receivables.gross', 'Gross')}</TableHead>
              <TableHead className="text-right">{t('receivables.recoverable', 'Recoverable')}</TableHead>
              <TableHead>{t('receivables.status', 'Status')}</TableHead>
              <TableHead>{t('receivables.expected_date', 'Expected Date')}</TableHead>
              <TableHead className="text-right">{t('receivables.probability', 'Prob %')}</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {receivables.map((r) => (
              <TableRow
                key={r.id}
                className={cn(r.status === 'irrecoverable' && 'opacity-60 line-through')}
              >
                <TableCell>
                  <Input
                    value={r.counterparty}
                    onChange={(e) => updateReceivable(r.id, 'counterparty', e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={r.nature}
                    onValueChange={(v) => updateReceivable(r.id, 'nature', v)}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(NATURE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={r.period}
                    onChange={(e) => updateReceivable(r.id, 'period', e.target.value)}
                    className="h-8 w-[100px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={r.gross_amount}
                    onChange={(e) => updateReceivable(r.id, 'gross_amount', Number(e.target.value) || 0)}
                    className="h-8 text-right"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={r.recoverable_amount}
                    onChange={(e) => updateReceivable(r.id, 'recoverable_amount', Number(e.target.value) || 0)}
                    className="h-8 text-right"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={r.status}
                    onValueChange={(v) => updateReceivable(r.id, 'status', v)}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                      <SelectItem value="irrecoverable">Irrecoverable</SelectItem>
                    </SelectContent>
                  </Select>
                  {r.status === 'irrecoverable' && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      {t('receivables.excluded', 'Excluded from forecasts')}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={r.expected_date}
                    onChange={(e) => updateReceivable(r.id, 'expected_date', e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={r.probability_pct}
                    onChange={(e) => updateReceivable(r.id, 'probability_pct', Number(e.target.value) || 0)}
                    className="h-8 w-[70px] text-right"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeReceivable(r.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={addReceivable}>
          <Plus className="mr-2 h-4 w-4" />
          {t('receivables.add', 'Add Receivable')}
        </Button>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {t('receivables.import', 'Import from Excel')}
        </Button>
      </div>
    </div>
  );
}

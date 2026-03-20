import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { formatCurrency } from '@/lib/utils';
import type { PriorPayable } from '../types';

const NATURE_LABELS: Record<PriorPayable['nature'], string> = {
  maintenance: 'Maintenance',
  energy: 'Energie',
  personnel: 'Personnel',
  capex: 'CAPEX',
  fiscal: 'Fiscal',
  other: 'Autre',
};

interface PayablesPortfolioProps {
  payables: PriorPayable[];
  onChange: (payables: PriorPayable[]) => void;
}

function createEmptyPayable(): PriorPayable {
  return {
    id: `pay-${Date.now()}`,
    counterparty: '',
    nature: 'other',
    amount_due: 0,
    original_due_date: '',
    planned_payment_date: '',
    status: 'to_pay',
    disbursement_account: '',
  };
}

export function PayablesPortfolio({ payables, onChange }: PayablesPortfolioProps) {
  const { t } = useTranslation('opening-balance');

  const totalDue = payables.reduce((s, p) => s + p.amount_due, 0);

  const byStatus = {
    to_pay: payables.filter((p) => p.status === 'to_pay').length,
    late: payables.filter((p) => p.status === 'late').length,
    disputed: payables.filter((p) => p.status === 'disputed').length,
  };

  const byNature = Object.entries(NATURE_LABELS).map(([key, label]) => ({
    label,
    total: payables
      .filter((p) => p.nature === key)
      .reduce((s, p) => s + p.amount_due, 0),
  })).filter((n) => n.total > 0);

  function addPayable() {
    onChange([...payables, createEmptyPayable()]);
  }

  function removePayable(id: string) {
    onChange(payables.filter((p) => p.id !== id));
  }

  function updatePayable(id: string, field: keyof PriorPayable, value: unknown) {
    onChange(
      payables.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {t('payables.title', 'Prior Payables Portfolio')}
      </h3>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('payables.total_due', 'Total Due')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalDue, 'XOF')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('payables.by_status', 'By Status')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-xs">To Pay: {byStatus.to_pay} | Late: {byStatus.late} | Disputed: {byStatus.disputed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('payables.by_nature', 'By Nature')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {byNature.map((n) => (
              <p key={n.label} className="text-xs">{n.label}: {formatCurrency(n.total, 'XOF')}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('payables.count', 'Total Entries')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{payables.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">{t('payables.counterparty', 'Counterparty')}</TableHead>
              <TableHead>{t('payables.nature', 'Nature')}</TableHead>
              <TableHead className="text-right">{t('payables.amount', 'Amount Due')}</TableHead>
              <TableHead>{t('payables.original_date', 'Original Due')}</TableHead>
              <TableHead>{t('payables.planned_date', 'Planned Payment')}</TableHead>
              <TableHead>{t('payables.status', 'Status')}</TableHead>
              <TableHead>{t('payables.account', 'Account')}</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payables.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Input
                    value={p.counterparty}
                    onChange={(e) => updatePayable(p.id, 'counterparty', e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={p.nature}
                    onValueChange={(v) => updatePayable(p.id, 'nature', v)}
                  >
                    <SelectTrigger className="h-8 w-[130px]">
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
                    type="number"
                    value={p.amount_due}
                    onChange={(e) => updatePayable(p.id, 'amount_due', Number(e.target.value) || 0)}
                    className="h-8 text-right"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={p.original_due_date}
                    onChange={(e) => updatePayable(p.id, 'original_due_date', e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={p.planned_payment_date}
                    onChange={(e) => updatePayable(p.id, 'planned_payment_date', e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={p.status}
                    onValueChange={(v) => updatePayable(p.id, 'status', v)}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to_pay">To Pay</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={p.disbursement_account}
                    onChange={(e) => updatePayable(p.id, 'disbursement_account', e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removePayable(p.id)}
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
        <Button variant="outline" onClick={addPayable}>
          <Plus className="mr-2 h-4 w-4" />
          {t('payables.add', 'Add Payable')}
        </Button>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {t('payables.import', 'Import from Excel')}
        </Button>
      </div>
    </div>
  );
}

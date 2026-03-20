import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus, Save, Calculator } from 'lucide-react';
import type { BudgetLineInput } from '../types';
import { BudgetDistribution } from './budget-distribution';
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
  TableFooter,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

const MONTHS = [
  'month_01', 'month_02', 'month_03', 'month_04',
  'month_05', 'month_06', 'month_07', 'month_08',
  'month_09', 'month_10', 'month_11', 'month_12',
] as const;

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface BudgetGridProps {
  initialLines?: BudgetLineInput[];
  onSave: (lines: BudgetLineInput[]) => void;
  isPending?: boolean;
  currency?: string;
}

function createEmptyLine(): BudgetLineInput {
  return {
    category: '',
    subcategory: null,
    type: 'receipt',
    month_01: 0, month_02: 0, month_03: 0, month_04: 0,
    month_05: 0, month_06: 0, month_07: 0, month_08: 0,
    month_09: 0, month_10: 0, month_11: 0, month_12: 0,
  };
}

function getLineTotal(line: BudgetLineInput): number {
  return MONTHS.reduce((sum, month) => sum + (line[month] ?? 0), 0);
}

export function BudgetGrid({ initialLines = [], onSave, isPending, currency = 'USD' }: BudgetGridProps) {
  const { t } = useTranslation('budget');
  const [lines, setLines] = useState<BudgetLineInput[]>(
    initialLines.length > 0 ? initialLines : [createEmptyLine()]
  );
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);

  function handleDistributionApply(monthlyAmounts: number[]) {
    if (selectedLineIndex === null) return;
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== selectedLineIndex) return line;
        const updated = { ...line };
        MONTHS.forEach((month, mi) => {
          (updated as Record<string, unknown>)[month] = monthlyAmounts[mi];
        });
        return updated;
      })
    );
    setSelectedLineIndex(null);
  }

  const totals = useMemo(() => {
    const monthTotals = MONTHS.map((month) =>
      lines.reduce((sum, line) => {
        const value = line[month] ?? 0;
        return line.type === 'receipt' ? sum + value : sum - value;
      }, 0)
    );
    const totalReceipts = lines
      .filter((l) => l.type === 'receipt')
      .reduce((sum, l) => sum + getLineTotal(l), 0);
    const totalDisbursements = lines
      .filter((l) => l.type === 'disbursement')
      .reduce((sum, l) => sum + getLineTotal(l), 0);
    const net = totalReceipts - totalDisbursements;

    return { monthTotals, totalReceipts, totalDisbursements, net };
  }, [lines]);

  function updateLine(index: number, field: string, value: string | number | null) {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    );
  }

  function addRow() {
    setLines((prev) => [...prev, createEmptyLine()]);
  }

  function removeRow(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">{t('grid.category', 'Category')}</TableHead>
              <TableHead className="min-w-[120px]">{t('grid.subcategory', 'Subcategory')}</TableHead>
              <TableHead className="min-w-[120px]">{t('grid.type', 'Type')}</TableHead>
              {MONTH_LABELS.map((label) => (
                <TableHead key={label} className="min-w-[100px] text-right">
                  {label}
                </TableHead>
              ))}
              <TableHead className="min-w-[110px] text-right">{t('grid.total', 'Total')}</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {lines.map((line, index) => (
              <TableRow
                key={index}
                className={cn(
                  line.type === 'receipt' && 'bg-green-50/50 dark:bg-green-950/20',
                  line.type === 'disbursement' && 'bg-red-50/50 dark:bg-red-950/20'
                )}
              >
                <TableCell>
                  <Input
                    value={line.category}
                    onChange={(e) => updateLine(index, 'category', e.target.value)}
                    placeholder={t('grid.category_placeholder', 'Category')}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={line.subcategory ?? ''}
                    onChange={(e) => updateLine(index, 'subcategory', e.target.value || null)}
                    placeholder={t('grid.subcategory_placeholder', 'Subcategory')}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={line.type}
                    onValueChange={(value) => updateLine(index, 'type', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receipt">{t('grid.receipt', 'Receipt')}</SelectItem>
                      <SelectItem value="disbursement">{t('grid.disbursement', 'Disbursement')}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                {MONTHS.map((month) => (
                  <TableCell key={month}>
                    <Input
                      type="number"
                      value={line[month] ?? 0}
                      onChange={(e) => updateLine(index, month, Number(e.target.value) || 0)}
                      className="h-8 text-right"
                      min={0}
                      step={0.01}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium">
                  <span className={cn(
                    line.type === 'receipt' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(getLineTotal(line), currency)}
                  </span>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={t('grid.distribute', 'Distribute')}
                    onClick={() => {
                      setSelectedLineIndex(index);
                      setDistributionOpen(true);
                    }}
                  >
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow className="font-bold">
              <TableCell colSpan={3}>{t('grid.net_total', 'Net Total')}</TableCell>
              {totals.monthTotals.map((total, i) => (
                <TableCell key={i} className="text-right">
                  <span className={cn(total >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {formatCurrency(total, currency)}
                  </span>
                </TableCell>
              ))}
              <TableCell className="text-right">
                <span className={cn(totals.net >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(totals.net, currency)}
                </span>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          {t('grid.add_row', 'Add Row')}
        </Button>
        <Button onClick={() => onSave(lines)} disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? t('grid.saving', 'Saving...') : t('grid.save', 'Save Changes')}
        </Button>
      </div>

      <BudgetDistribution
        open={distributionOpen}
        onOpenChange={setDistributionOpen}
        onApply={handleDistributionApply}
      />
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { DistributionRule } from '../types';
import { budgetService } from '../services/budget.service';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DEFAULT_SEASONAL_WEIGHTS = [7, 7, 8, 8, 9, 9, 7, 6, 9, 10, 10, 10];

interface BudgetDistributionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (monthlyAmounts: number[]) => void;
}

export function BudgetDistribution({ open, onOpenChange, onApply }: BudgetDistributionProps) {
  const { t } = useTranslation('budget');
  const [ruleType, setRuleType] = useState<DistributionRule['type']>('equal');
  const [annualAmount, setAnnualAmount] = useState(120000000); // 120M FCFA
  const [weights, setWeights] = useState<number[]>(DEFAULT_SEASONAL_WEIGHTS);
  const [growthRate, setGrowthRate] = useState(5);

  const rule: DistributionRule = {
    type: ruleType,
    weights: ruleType === 'weighted' || ruleType === 'custom' ? weights : undefined,
  };

  const distribution = budgetService.applyDistribution(
    annualAmount,
    rule,
    ruleType === 'progressive' ? growthRate : undefined
  );

  const totalDistributed = distribution.reduce((s, v) => s + v, 0);

  function updateWeight(index: number, value: number) {
    setWeights((prev) => prev.map((w, i) => (i === index ? value : w)));
  }

  function handleApply() {
    onApply(distribution);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('distribution.title', 'Budget Distribution')}
          </DialogTitle>
          <DialogDescription>
            {t('distribution.description', 'Distribute an annual amount across 12 months using a rule.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('distribution.annual_amount', 'Annual Amount (FCFA)')}</Label>
              <Input
                type="number"
                value={annualAmount}
                onChange={(e) => setAnnualAmount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('distribution.rule', 'Distribution Rule')}</Label>
              <Select value={ruleType} onValueChange={(v) => setRuleType(v as DistributionRule['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">{t('distribution.equal', 'Equal (1/12)')}</SelectItem>
                  <SelectItem value="weighted">{t('distribution.weighted', 'Weighted (seasonal)')}</SelectItem>
                  <SelectItem value="progressive">{t('distribution.progressive', 'Progressive (growth)')}</SelectItem>
                  <SelectItem value="custom">{t('distribution.custom', 'Custom weights')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {ruleType === 'progressive' && (
            <div className="space-y-2">
              <Label>{t('distribution.growth_rate', 'Monthly Growth Rate (%)')}</Label>
              <Input
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value) || 0)}
                className="max-w-[200px]"
              />
            </div>
          )}

          {(ruleType === 'weighted' || ruleType === 'custom') && (
            <div className="space-y-2">
              <Label>{t('distribution.weights', 'Weights per month')}</Label>
              <div className="grid grid-cols-6 gap-2">
                {MONTH_LABELS.map((label, i) => (
                  <div key={label} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={weights[i]}
                      onChange={(e) => updateWeight(i, Number(e.target.value) || 0)}
                      className="h-8 text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {MONTH_LABELS.map((m) => (
                    <TableHead key={m} className="text-right text-xs">{m}</TableHead>
                  ))}
                  <TableHead className="text-right text-xs font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {distribution.map((amount, i) => (
                    <TableCell key={i} className="text-right text-xs">
                      {formatCurrency(amount, 'XOF')}
                    </TableCell>
                  ))}
                  <TableCell className="text-right text-xs font-bold">
                    {formatCurrency(totalDistributed, 'XOF')}
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  {distribution.map((amount, i) => (
                    <TableCell key={i} className="text-right text-xs text-muted-foreground">
                      {annualAmount > 0 ? ((amount / annualAmount) * 100).toFixed(1) : 0}%
                    </TableCell>
                  ))}
                  <TableCell className="text-right text-xs font-bold">100%</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('distribution.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleApply}>
            {t('distribution.apply', 'Apply Distribution')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

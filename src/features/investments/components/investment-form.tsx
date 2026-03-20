import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { investmentSchema, type InvestmentFormData, type Investment } from '../types';

const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'MAD', 'TND', 'EGP'];

const INVESTMENT_TYPES = [
  { value: 'term_deposit', label: 'Term Deposit' },
  { value: 'treasury_bill', label: 'Treasury Bill' },
  { value: 'bond', label: 'Bond' },
  { value: 'money_market', label: 'Money Market' },
  { value: 'certificate_of_deposit', label: 'Certificate of Deposit' },
  { value: 'other', label: 'Other' },
] as const;

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvestmentFormData) => void;
  defaultValues?: Investment | null;
  loading?: boolean;
}

export function InvestmentForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading = false,
}: InvestmentFormProps) {
  const { t } = useTranslation();

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: '',
      type: 'term_deposit',
      institution: '',
      amount: 0,
      currency: 'XOF',
      interest_rate: 0,
      start_date: '',
      maturity_date: '',
      auto_renew: false,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name,
        type: defaultValues.type,
        institution: defaultValues.institution,
        amount: defaultValues.amount,
        currency: defaultValues.currency,
        interest_rate: defaultValues.interest_rate,
        start_date: defaultValues.start_date,
        maturity_date: defaultValues.maturity_date,
        auto_renew: defaultValues.auto_renew,
      });
    } else {
      form.reset({
        name: '',
        type: 'term_deposit',
        institution: '',
        amount: 0,
        currency: 'XOF',
        interest_rate: 0,
        start_date: '',
        maturity_date: '',
        auto_renew: false,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: InvestmentFormData) => {
    onSubmit(data);
  };

  const isEditing = !!defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('investments.editInvestment', 'Edit Investment')
              : t('investments.addInvestment', 'Add Investment')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('investments.name', 'Investment Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Term Deposit Q1 2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('investments.type', 'Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INVESTMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('investments.institution', 'Institution')}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. BCEAO, Ecobank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('investments.amount', 'Amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('investments.currency', 'Currency')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('investments.interestRate', 'Rate (%)')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('investments.startDate', 'Start Date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maturity_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('investments.maturityDate', 'Maturity Date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="auto_renew"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('investments.autoRenew', 'Auto Renew')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? t('common.save', 'Save') : t('common.create', 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

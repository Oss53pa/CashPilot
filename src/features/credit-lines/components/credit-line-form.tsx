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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { creditLineSchema, type CreditLineFormData, type CreditLine } from '../types';

const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'MAD', 'TND', 'EGP'];

const CREDIT_LINE_TYPES = [
  { value: 'overdraft', label: 'Overdraft' },
  { value: 'revolving', label: 'Revolving Credit' },
  { value: 'guarantee', label: 'Guarantee' },
  { value: 'letter_of_credit', label: 'Letter of Credit' },
] as const;

interface CreditLineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreditLineFormData) => void;
  defaultValues?: CreditLine | null;
  loading?: boolean;
}

export function CreditLineForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading = false,
}: CreditLineFormProps) {
  const { t } = useTranslation();

  const form = useForm<CreditLineFormData>({
    resolver: zodResolver(creditLineSchema),
    defaultValues: {
      bank_name: '',
      type: 'overdraft',
      limit_amount: 0,
      used_amount: 0,
      currency: 'XOF',
      interest_rate: 0,
      start_date: '',
      expiry_date: '',
      covenants: null,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        bank_name: defaultValues.bank_name,
        type: defaultValues.type,
        limit_amount: defaultValues.limit_amount,
        used_amount: defaultValues.used_amount,
        currency: defaultValues.currency,
        interest_rate: defaultValues.interest_rate,
        start_date: defaultValues.start_date,
        expiry_date: defaultValues.expiry_date,
        covenants: defaultValues.covenants,
      });
    } else {
      form.reset({
        bank_name: '',
        type: 'overdraft',
        limit_amount: 0,
        used_amount: 0,
        currency: 'XOF',
        interest_rate: 0,
        start_date: '',
        expiry_date: '',
        covenants: null,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: CreditLineFormData) => {
    onSubmit(data);
  };

  const isEditing = !!defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('creditLines.editCreditLine', 'Edit Credit Line')
              : t('creditLines.addCreditLine', 'Add Credit Line')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('creditLines.bankName', 'Bank Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ecobank, SGBCI" {...field} />
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
                    <FormLabel>{t('creditLines.type', 'Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CREDIT_LINE_TYPES.map((type) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="limit_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('creditLines.limitAmount', 'Limit Amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="used_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('creditLines.usedAmount', 'Used Amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('creditLines.currency', 'Currency')}</FormLabel>
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
                    <FormLabel>{t('creditLines.interestRate', 'Interest Rate (%)')}</FormLabel>
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
                    <FormLabel>{t('creditLines.startDate', 'Start Date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('creditLines.expiryDate', 'Expiry Date')}</FormLabel>
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
              name="covenants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('creditLines.covenants', 'Covenants')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter covenant details..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
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

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

import { cashRegisterSchema, type CashRegisterFormData } from '../types';
import type { BankAccount } from '@/types/database';

const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES'];

const REGISTER_TYPES = [
  { value: 'cash', label: 'Caisse' },
  { value: 'mobile_money', label: 'Mobile Money' },
] as const;

const MOBILE_OPERATORS = ['Orange Money', 'MTN MoMo', 'Wave', 'Moov Money', 'Free Money', 'Airtel Money'];

interface CashRegisterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CashRegisterFormData) => void;
  defaultValues?: BankAccount | null;
  defaultType?: 'cash' | 'mobile_money';
  loading?: boolean;
}

export function CashRegisterForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  defaultType = 'cash',
  loading = false,
}: CashRegisterFormProps) {
  const { t } = useTranslation();

  const form = useForm<CashRegisterFormData>({
    resolver: zodResolver(cashRegisterSchema),
    defaultValues: {
      name: '',
      type: defaultType,
      currency: 'XOF',
      location: null,
      operator: null,
      phone_number: null,
      initial_balance: 0,
      is_active: true,
    },
  });

  const watchType = form.watch('type');

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.bank_name,
        type: defaultValues.account_type as 'cash' | 'mobile_money',
        currency: defaultValues.currency,
        location: null,
        operator: null,
        phone_number: defaultValues.account_number,
        initial_balance: defaultValues.initial_balance,
        is_active: defaultValues.is_active,
      });
    } else {
      form.reset({
        name: '',
        type: defaultType,
        currency: 'XOF',
        location: null,
        operator: null,
        phone_number: null,
        initial_balance: 0,
        is_active: true,
      });
    }
  }, [defaultValues, defaultType, form]);

  const handleSubmit = (data: CashRegisterFormData) => {
    onSubmit(data);
  };

  const isEditing = !!defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('cashRegisters.edit', 'Edit Register')
              : t('cashRegisters.add', 'Add Register')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cashRegisters.name', 'Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Caisse Principale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cashRegisters.type', 'Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGISTER_TYPES.map((type) => (
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

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cashRegisters.currency', 'Currency')}</FormLabel>
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
            </div>

            {watchType === 'mobile_money' && (
              <>
                <FormField
                  control={form.control}
                  name="operator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('cashRegisters.operator', 'Operator')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOBILE_OPERATORS.map((op) => (
                            <SelectItem key={op} value={op}>
                              {op}
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
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('cashRegisters.phoneNumber', 'Phone Number')}</FormLabel>
                      <FormControl>
                        <Input placeholder="+225 07 00 00 00 00" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {watchType === 'cash' && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cashRegisters.location', 'Location')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bureau Principal" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="initial_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('cashRegisters.initialBalance', 'Initial Balance')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('cashRegisters.active', 'Active')}</FormLabel>
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

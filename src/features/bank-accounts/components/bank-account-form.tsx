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

import { bankAccountSchema, type BankAccountFormData } from '../types';
import type { BankAccount } from '@/types/database';

const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'MAD', 'TND', 'EGP'];

const ACCOUNT_TYPES = [
  { value: 'current', label: 'Current Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cash', label: 'Cash' },
] as const;

interface BankAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BankAccountFormData) => void;
  defaultValues?: BankAccount | null;
  loading?: boolean;
}

export function BankAccountForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading = false,
}: BankAccountFormProps) {
  const { t } = useTranslation();

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_name: '',
      account_number: '',
      account_name: '',
      currency: 'XOF',
      account_type: 'current',
      initial_balance: 0,
      iban: null,
      swift_code: null,
      is_active: true,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        bank_name: defaultValues.bank_name,
        account_number: defaultValues.account_number,
        account_name: defaultValues.account_name,
        currency: defaultValues.currency,
        account_type: defaultValues.account_type,
        initial_balance: defaultValues.initial_balance,
        iban: defaultValues.iban,
        swift_code: defaultValues.swift_code,
        is_active: defaultValues.is_active,
      });
    } else {
      form.reset({
        bank_name: '',
        account_number: '',
        account_name: '',
        currency: 'XOF',
        account_type: 'current',
        initial_balance: 0,
        iban: null,
        swift_code: null,
        is_active: true,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: BankAccountFormData) => {
    onSubmit(data);
  };

  const isEditing = !!defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('bankAccounts.editAccount', 'Edit Account') : t('bankAccounts.addAccount', 'Add Account')}
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
                    <FormLabel>{t('bankAccounts.bankName', 'Bank Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BCEAO, Ecobank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bankAccounts.accountName', 'Account Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Operating Account" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bankAccounts.accountNumber', 'Account Number')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bankAccounts.accountType', 'Account Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((type) => (
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bankAccounts.currency', 'Currency')}</FormLabel>
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
                name="initial_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bankAccounts.initialBalance', 'Initial Balance')}</FormLabel>
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
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bankAccounts.iban', 'IBAN')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="swift_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bankAccounts.swiftCode', 'SWIFT Code')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('bankAccounts.active', 'Active')}</FormLabel>
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

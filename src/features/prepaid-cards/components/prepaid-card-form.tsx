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

import { prepaidCardSchema, type PrepaidCardFormData, type PrepaidCard } from '../types';

const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'MAD', 'TND', 'EGP'];

const CARD_TYPES = [
  { value: 'corporate', label: 'Corporate' },
  { value: 'gift', label: 'Gift' },
  { value: 'travel', label: 'Travel' },
] as const;

interface PrepaidCardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PrepaidCardFormData) => void;
  defaultValues?: PrepaidCard | null;
  loading?: boolean;
}

export function PrepaidCardForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading = false,
}: PrepaidCardFormProps) {
  const { t } = useTranslation();

  const form = useForm<PrepaidCardFormData>({
    resolver: zodResolver(prepaidCardSchema),
    defaultValues: {
      card_number: '',
      holder_name: '',
      type: 'corporate',
      limit: 0,
      balance: 0,
      currency: 'XOF',
      expiry_date: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        card_number: defaultValues.card_number,
        holder_name: defaultValues.holder_name,
        type: defaultValues.type,
        limit: defaultValues.limit,
        balance: defaultValues.balance,
        currency: defaultValues.currency,
        expiry_date: defaultValues.expiry_date,
        is_active: defaultValues.is_active,
      });
    } else {
      form.reset({
        card_number: '',
        holder_name: '',
        type: 'corporate',
        limit: 0,
        balance: 0,
        currency: 'XOF',
        expiry_date: '',
        is_active: true,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: PrepaidCardFormData) => {
    onSubmit(data);
  };

  const isEditing = !!defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('prepaidCards.editCard', 'Edit Prepaid Card')
              : t('prepaidCards.addCard', 'Add Prepaid Card')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="card_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('prepaidCards.cardNumber', 'Card Number')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 4111111111111111" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="holder_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('prepaidCards.holderName', 'Holder Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('prepaidCards.type', 'Card Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CARD_TYPES.map((type) => (
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
                    <FormLabel>{t('prepaidCards.currency', 'Currency')}</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('prepaidCards.limit', 'Card Limit')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('prepaidCards.balance', 'Current Balance')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('prepaidCards.expiryDate', 'Expiry Date')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <FormLabel>{t('prepaidCards.active', 'Active')}</FormLabel>
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

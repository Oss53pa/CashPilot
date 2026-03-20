import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { counterpartySchema, type CounterpartyInput } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COUNTERPARTY_TYPES } from '@/types/enums';

interface CounterpartyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CounterpartyInput) => void;
  defaultValues?: Partial<CounterpartyInput>;
  isPending?: boolean;
}

export function CounterpartyForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isPending,
}: CounterpartyFormProps) {
  const { t } = useTranslation('counterparties');

  const form = useForm<CounterpartyInput>({
    resolver: zodResolver(counterpartySchema),
    defaultValues: {
      name: '',
      short_name: null,
      type: 'customer',
      tax_id: null,
      email: null,
      phone: null,
      address: null,
      payment_terms: 30,
      is_active: true,
      ...defaultValues,
    },
  });

  function handleSubmit(values: CounterpartyInput) {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues
              ? t('form.edit_title', 'Edit Counterparty')
              : t('form.create_title', 'Add Counterparty')}
          </DialogTitle>
          <DialogDescription>
            {t('form.description', 'Fill in the counterparty details.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.name', 'Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('form.name_placeholder', 'Full name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="short_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.short_name', 'Short Name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.short_name_placeholder', 'Abbreviation')}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.type', 'Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.select_type', 'Select type')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTERPARTY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
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
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.tax_id', 'Tax ID')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.tax_id_placeholder', 'Tax identification')}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.email', 'Email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.phone', 'Phone')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 234 567 890"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.address', 'Address')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.address_placeholder', 'Full address')}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.payment_terms', 'Payment Terms (days)')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel>{t('form.is_active', 'Active')}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('form.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('form.saving', 'Saving...') : t('form.save', 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { forecastSchema, type ForecastInput } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { CASH_FLOW_TYPES, FORECAST_HORIZONS, FORECAST_SOURCES } from '@/types/enums';

interface ForecastFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ForecastInput) => void;
  defaultValues?: Partial<ForecastInput>;
  isPending?: boolean;
}

export function ForecastForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isPending,
}: ForecastFormProps) {
  const { t } = useTranslation('forecast');

  const form = useForm<ForecastInput>({
    resolver: zodResolver(forecastSchema),
    defaultValues: {
      type: 'receipt',
      category: '',
      amount: 0,
      forecast_date: '',
      horizon: 'monthly',
      confidence: 50,
      source: 'manual',
      notes: null,
      ...defaultValues,
    },
  });

  function handleSubmit(values: ForecastInput) {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues
              ? t('form.edit_title', 'Edit Forecast')
              : t('form.create_title', 'Add Forecast')}
          </DialogTitle>
          <DialogDescription>
            {t('form.description', 'Create a new forecast entry.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CASH_FLOW_TYPES.map((type) => (
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.category', 'Category')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('form.category_placeholder', 'e.g. Sales')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.amount', 'Amount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
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
                name="forecast_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.forecast_date', 'Forecast Date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="horizon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.horizon', 'Horizon')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FORECAST_HORIZONS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h.charAt(0).toUpperCase() + h.slice(1)}
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
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.source', 'Source')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FORECAST_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s === 'ai' ? 'AI' : s.charAt(0).toUpperCase() + s.slice(1)}
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
              name="confidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('form.confidence', 'Confidence')} ({field.value}%)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="range"
                      min={0}
                      max={100}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.notes', 'Notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.notes_placeholder', 'Optional notes...')}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

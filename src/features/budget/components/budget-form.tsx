import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { budgetCreateSchema, type BudgetCreateInput } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { BUDGET_STATUSES } from '@/types/enums';

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetCreateInput) => void;
  isPending?: boolean;
}

export function BudgetForm({ open, onOpenChange, onSubmit, isPending }: BudgetFormProps) {
  const { t } = useTranslation('budget');

  const form = useForm<BudgetCreateInput>({
    resolver: zodResolver(budgetCreateSchema),
    defaultValues: {
      name: '',
      fiscal_year: new Date().getFullYear(),
      status: 'draft',
    },
  });

  function handleSubmit(values: BudgetCreateInput) {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('form.create_title', 'Create Budget')}</DialogTitle>
          <DialogDescription>
            {t('form.create_description', 'Set up a new budget for your company.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.name', 'Budget Name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.name_placeholder', 'e.g. Operating Budget 2026')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fiscal_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fiscal_year', 'Fiscal Year')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.status', 'Status')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.select_status', 'Select status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUDGET_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('form.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t('form.creating', 'Creating...') : t('form.create', 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

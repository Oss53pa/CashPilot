import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cashFlowSchema, type CashFlowFormData, receiptCategories, disbursementCategories } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CashFlow, BankAccount, Counterparty } from '@/types/database';

interface CashFlowFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CashFlowFormData) => void;
  defaultValues?: Partial<CashFlowFormData>;
  cashFlow?: CashFlow | null;
  type: 'receipt' | 'disbursement';
  bankAccounts: BankAccount[];
  counterparties: Counterparty[];
  isLoading?: boolean;
}

export function CashFlowForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  cashFlow,
  type,
  bankAccounts,
  counterparties,
  isLoading,
}: CashFlowFormProps) {
  const categories = type === 'receipt' ? receiptCategories : disbursementCategories;

  const form = useForm<CashFlowFormData>({
    resolver: zodResolver(cashFlowSchema),
    defaultValues: {
      type,
      category: '',
      subcategory: null,
      amount: 0,
      currency: 'XOF',
      value_date: '',
      operation_date: new Date().toISOString().split('T')[0],
      reference: null,
      description: null,
      counterparty_id: null,
      bank_account_id: '',
      status: 'pending',
      ...defaultValues,
      ...(cashFlow && {
        type: cashFlow.type,
        category: cashFlow.category,
        subcategory: cashFlow.subcategory,
        amount: cashFlow.amount,
        currency: cashFlow.currency,
        value_date: cashFlow.value_date,
        operation_date: cashFlow.operation_date,
        reference: cashFlow.reference,
        description: cashFlow.description,
        counterparty_id: cashFlow.counterparty_id,
        bank_account_id: cashFlow.bank_account_id,
        status: cashFlow.status,
      }),
    },
  });

  function handleSubmit(data: CashFlowFormData) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {cashFlow ? 'Edit' : 'New'}{' '}
            {type === 'receipt' ? 'Receipt' : 'Disbursement'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
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
              name="counterparty_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Counterparty</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select counterparty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {counterparties.map((cp) => (
                        <SelectItem key={cp.id} value={cp.id}>
                          {cp.name}
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
              name="bank_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.bank_name} - {acc.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value Date</FormLabel>
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : cashFlow ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

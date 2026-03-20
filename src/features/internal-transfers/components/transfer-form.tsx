import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { internalTransferSchema, type InternalTransferFormData } from '../types';
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
import type { BankAccount, InternalTransfer } from '@/types/database';

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InternalTransferFormData) => void;
  transfer?: InternalTransfer | null;
  bankAccounts: BankAccount[];
  isLoading?: boolean;
}

export function TransferForm({
  open,
  onOpenChange,
  onSubmit,
  transfer,
  bankAccounts,
  isLoading,
}: TransferFormProps) {
  const form = useForm<InternalTransferFormData>({
    resolver: zodResolver(internalTransferSchema),
    defaultValues: {
      from_account_id: transfer?.from_account_id ?? '',
      to_account_id: transfer?.to_account_id ?? '',
      amount: transfer?.amount ?? 0,
      currency: transfer?.currency ?? 'XOF',
      execution_date: transfer?.execution_date ?? new Date().toISOString().split('T')[0],
      notes: transfer?.notes ?? null,
    },
  });

  function handleSubmit(data: InternalTransferFormData) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {transfer ? 'Edit Transfer' : 'New Transfer'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="from_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.bank_name} - {acc.account_name} ({acc.currency})
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
              name="to_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.bank_name} - {acc.account_name} ({acc.currency})
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

            <FormField
              control={form.control}
              name="execution_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Execution Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Notes</FormLabel>
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
                {isLoading ? 'Saving...' : transfer ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

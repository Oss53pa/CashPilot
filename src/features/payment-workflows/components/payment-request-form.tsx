import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentRequestSchema, type PaymentRequestFormData } from '../types';
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
import type { PaymentRequest, BankAccount, Counterparty } from '@/types/database';

interface PaymentRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PaymentRequestFormData) => void;
  request?: PaymentRequest | null;
  bankAccounts: BankAccount[];
  counterparties: Counterparty[];
  isLoading?: boolean;
}

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

const categories = [
  'salaries',
  'suppliers',
  'rent',
  'taxes',
  'utilities',
  'insurance',
  'maintenance',
  'other',
];

export function PaymentRequestForm({
  open,
  onOpenChange,
  onSubmit,
  request,
  bankAccounts,
  counterparties,
  isLoading,
}: PaymentRequestFormProps) {
  const form = useForm<PaymentRequestFormData>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      counterparty_id: request?.counterparty_id ?? null,
      bank_account_id: request?.bank_account_id ?? null,
      amount: request?.amount ?? 0,
      currency: request?.currency ?? 'XOF',
      payment_date: request?.payment_date ?? '',
      category: request?.category ?? '',
      description: request?.description ?? '',
      priority: request?.priority ?? 'medium',
      attachments: request?.attachments ?? [],
    },
  });

  function handleSubmit(data: PaymentRequestFormData) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {request ? 'Edit Payment Request' : 'New Payment Request'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="counterparty_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Counterparty</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
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
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
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

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              File attachments area (drag and drop or click to upload)
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : request ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

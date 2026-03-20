import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

import { transferFormSchema, type TransferFormData, type Transfer } from '../types';

const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'MAD', 'TND', 'EGP'];

const TRANSFER_TYPES = [
  { value: 'internal', label: 'Internal Transfer' },
  { value: 'intercompany', label: 'Intercompany Transfer' },
  { value: 'cash_to_bank', label: 'Cash to Bank' },
  { value: 'bank_to_cash', label: 'Bank to Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
] as const;

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransferFormData) => void;
  defaultValues?: Transfer | null;
  loading?: boolean;
  accounts?: { id: string; account_name: string; bank_name: string }[];
  companies?: { id: string; name: string }[];
}

export function TransferForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading = false,
  accounts = [],
  companies = [],
}: TransferFormProps) {
  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      from_account_id: '',
      to_account_id: '',
      amount: 0,
      currency: 'XOF',
      transfer_type: 'internal',
      transfer_date: new Date().toISOString().split('T')[0],
      value_date: null,
      reference: null,
      description: null,
      to_company_id: null,
      interest_rate: null,
      convention_reference: null,
    },
  });

  const transferType = form.watch('transfer_type');
  const isIntercompany = transferType === 'intercompany';

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        from_account_id: defaultValues.from_account_id,
        to_account_id: defaultValues.to_account_id,
        amount: defaultValues.amount,
        currency: defaultValues.currency,
        transfer_type: defaultValues.transfer_type,
        transfer_date: defaultValues.transfer_date,
        value_date: defaultValues.value_date,
        reference: defaultValues.reference,
        description: defaultValues.description,
        to_company_id: defaultValues.to_company_id,
        interest_rate: defaultValues.interest_rate,
        convention_reference: defaultValues.convention_reference,
      });
    } else {
      form.reset({
        from_account_id: '',
        to_account_id: '',
        amount: 0,
        currency: 'XOF',
        transfer_type: 'internal',
        transfer_date: new Date().toISOString().split('T')[0],
        value_date: null,
        reference: null,
        description: null,
        to_company_id: null,
        interest_rate: null,
        convention_reference: null,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: TransferFormData) => {
    onSubmit(data);
  };

  const isEditing = !!defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Transfer' : 'Create Transfer'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transfer_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSFER_TYPES.map((type) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="from_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.bank_name} - {account.account_name}
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
                    <FormLabel>Destination Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.bank_name} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                name="transfer_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Date</FormLabel>
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
              name="value_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isIntercompany && (
              <>
                <FormField
                  control={form.control}
                  name="to_company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Company</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
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
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="convention_reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Convention Reference</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. CONV-2026-001"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. TRF-2026-001"
                      {...field}
                      value={field.value ?? ''}
                    />
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
                    <Textarea
                      placeholder="Enter transfer details..."
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
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

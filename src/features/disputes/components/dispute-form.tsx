import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { disputeFileSchema, type DisputeFileFormData } from '../types';
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
import type { DisputeFile, Counterparty } from '@/types/database';

interface DisputeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DisputeFileFormData) => void;
  dispute?: DisputeFile | null;
  counterparties: Counterparty[];
  isLoading?: boolean;
}

const disputeTypes = [
  { value: 'litigation', label: 'Litigation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'mediation', label: 'Mediation' },
  { value: 'recovery', label: 'Recovery' },
] as const;

const disputeStatuses = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
  { value: 'written_off', label: 'Written Off' },
] as const;

const exitScenarios = [
  { value: 'favorable', label: 'Favorable' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'unfavorable', label: 'Unfavorable' },
] as const;

export function DisputeForm({
  open,
  onOpenChange,
  onSubmit,
  dispute,
  counterparties,
  isLoading,
}: DisputeFormProps) {
  const form = useForm<DisputeFileFormData>({
    resolver: zodResolver(disputeFileSchema),
    defaultValues: {
      reference: dispute?.reference ?? '',
      counterparty_id: dispute?.counterparty_id ?? '',
      type: dispute?.type ?? 'litigation',
      amount_disputed: dispute?.amount_disputed ?? 0,
      amount_provision: dispute?.amount_provision ?? 0,
      currency: dispute?.currency ?? 'XOF',
      status: dispute?.status ?? 'open',
      opened_date: dispute?.opened_date ?? new Date().toISOString().split('T')[0],
      closed_date: dispute?.closed_date ?? null,
      description: dispute?.description ?? null,
      lawyer: dispute?.lawyer ?? null,
      court: dispute?.court ?? null,
      next_hearing: dispute?.next_hearing ?? null,
      exit_scenario: dispute?.exit_scenario ?? null,
      probability: dispute?.probability ?? null,
    },
  });

  function handleSubmit(data: DisputeFileFormData) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dispute ? 'Edit Dispute' : 'New Dispute'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {disputeTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {disputeStatuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
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
                name="amount_disputed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Disputed</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount_provision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provision Amount</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="opened_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opened Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_hearing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Hearing</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lawyer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lawyer</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="court"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Court</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="exit_scenario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Scenario</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scenario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {exitScenarios.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
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
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : dispute ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

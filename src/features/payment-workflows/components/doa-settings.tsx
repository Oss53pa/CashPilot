import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DOARule, DOARuleFormData, ApproverRole, PaymentNature } from '../types';
import { doaRuleSchema } from '../types';

interface DOASettingsProps {
  rules: DOARule[];
  onCreateRule: (data: DOARuleFormData) => void;
  onUpdateRule: (id: string, data: Partial<DOARuleFormData>) => void;
  onDeleteRule: (id: string) => void;
  isLoading?: boolean;
}

const NATURE_LABELS: Record<PaymentNature, string> = {
  all: 'Standard',
  capex: 'CAPEX',
  intercompany: 'Inter-company',
  emergency: 'Emergency',
};

const NATURE_VARIANTS: Record<PaymentNature, 'default' | 'secondary' | 'destructive'> = {
  all: 'default',
  capex: 'secondary',
  intercompany: 'secondary',
  emergency: 'destructive',
};

const APPROVER_ROLES: ApproverRole[] = ['DAF', 'DGA', 'DG', 'CA'];

function formatAmount(amount: number): string {
  if (amount >= 999_999_999_000) return 'Unlimited';
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString('fr-FR');
}

function formatDelay(hours: number): string {
  if (hours === 0) return 'Immediate';
  if (hours < 24) return `${hours}h`;
  return `${hours / 24}j (${hours}h)`;
}

export function DOASettings({
  rules,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
  isLoading,
}: DOASettingsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DOARule | null>(null);

  const form = useForm<DOARuleFormData>({
    resolver: zodResolver(doaRuleSchema),
    defaultValues: {
      payment_nature: 'all',
      min_amount: 0,
      max_amount: 500000,
      approvers: ['DAF'],
      max_delay_hours: 0,
      requires_convention: false,
    },
  });

  function handleOpenCreate() {
    setEditingRule(null);
    form.reset({
      payment_nature: 'all',
      min_amount: 0,
      max_amount: 500000,
      approvers: ['DAF'],
      max_delay_hours: 0,
      requires_convention: false,
    });
    setFormOpen(true);
  }

  function handleOpenEdit(rule: DOARule) {
    setEditingRule(rule);
    form.reset({
      payment_nature: rule.payment_nature,
      min_amount: rule.min_amount,
      max_amount: rule.max_amount,
      approvers: rule.approvers,
      max_delay_hours: rule.max_delay_hours,
      requires_convention: rule.requires_convention,
    });
    setFormOpen(true);
  }

  function handleSubmit(data: DOARuleFormData) {
    if (editingRule) {
      onUpdateRule(editingRule.id, data);
    } else {
      onCreateRule(data);
    }
    setFormOpen(false);
    setEditingRule(null);
  }

  // Sort rules: by nature, then by min_amount
  const sortedRules = [...rules].sort((a, b) => {
    if (a.payment_nature !== b.payment_nature) {
      const order: PaymentNature[] = ['all', 'capex', 'intercompany', 'emergency'];
      return order.indexOf(a.payment_nature) - order.indexOf(b.payment_nature);
    }
    return a.min_amount - b.min_amount;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Delegation of Authority (DOA) Rules</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure approval chains based on payment nature and amount thresholds (FCFA)
            </p>
          </div>
          <Button onClick={handleOpenCreate}>Add Rule</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nature</TableHead>
                <TableHead>Amount Range (FCFA)</TableHead>
                <TableHead>Approvers</TableHead>
                <TableHead>Max Delay</TableHead>
                <TableHead>Convention</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Badge variant={NATURE_VARIANTS[rule.payment_nature]}>
                      {NATURE_LABELS[rule.payment_nature]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatAmount(rule.min_amount)} - {formatAmount(rule.max_amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {rule.approvers.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatDelay(rule.max_delay_hours)}</TableCell>
                  <TableCell>
                    {rule.requires_convention ? (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(rule)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => onDeleteRule(rule.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No DOA rules configured. Add a rule to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rule Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit DOA Rule' : 'New DOA Rule'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="payment_nature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Nature</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Standard (All)</SelectItem>
                        <SelectItem value="capex">CAPEX</SelectItem>
                        <SelectItem value="intercompany">Inter-company</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="min_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Amount (FCFA)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Amount (FCFA)</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="approvers"
                render={() => (
                  <FormItem>
                    <FormLabel>Required Approvers</FormLabel>
                    <div className="flex gap-4 pt-1">
                      {APPROVER_ROLES.map((role) => (
                        <FormField
                          key={role}
                          control={form.control}
                          name="approvers"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-1.5 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? [];
                                    if (checked) {
                                      field.onChange([...current, role]);
                                    } else {
                                      field.onChange(current.filter((r: string) => r !== role));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {role}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_delay_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Delay (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requires_convention"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="cursor-pointer">Requires Convention</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Convention must be signed before execution
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingRule ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

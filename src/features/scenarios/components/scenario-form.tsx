import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scenarioSchema, type ScenarioFormData } from '../types';
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
import type { Scenario } from '../types';

interface ScenarioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ScenarioFormData) => void;
  scenario?: Scenario | null;
  isLoading?: boolean;
}

const scenarioTypes = [
  { value: 'optimistic', label: 'Optimistic' },
  { value: 'pessimistic', label: 'Pessimistic' },
  { value: 'custom', label: 'Custom' },
] as const;

export function ScenarioForm({
  open,
  onOpenChange,
  onSubmit,
  scenario,
  isLoading,
}: ScenarioFormProps) {
  const form = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      name: scenario?.name ?? '',
      base_forecast_id: scenario?.base_forecast_id ?? '',
      type: scenario?.type ?? 'custom',
      adjustments: scenario?.adjustments ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'adjustments',
  });

  function handleSubmit(data: ScenarioFormData) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {scenario ? 'Edit Scenario' : 'Create Scenario'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Scenario name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {scenarioTypes.map((t) => (
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
              name="base_forecast_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Forecast ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Forecast ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Adjustments</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ category: '', percentage_change: 0 })}
                >
                  Add Adjustment
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`adjustments.${index}.category`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Category" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`adjustments.${index}.percentage_change`}
                    render={({ field }) => (
                      <FormItem className="w-28">
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="%" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : scenario ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

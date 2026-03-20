import { z } from 'zod';
import type { InternalTransfer } from '@/types/database';

export const internalTransferSchema = z.object({
  from_account_id: z.string().min(1, 'Source account is required'),
  to_account_id: z.string().min(1, 'Destination account is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  execution_date: z.string().min(1, 'Execution date is required'),
  notes: z.string().optional().nullable(),
}).refine((data) => data.from_account_id !== data.to_account_id, {
  message: 'Source and destination accounts must be different',
  path: ['to_account_id'],
});

export type InternalTransferFormData = z.infer<typeof internalTransferSchema>;

export type { InternalTransfer };

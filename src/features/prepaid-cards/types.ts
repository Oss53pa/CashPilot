import { z } from 'zod';

export const prepaidCardSchema = z.object({
  card_number: z.string().min(1, 'Required'),
  holder_name: z.string().min(1, 'Required'),
  type: z.enum(['corporate', 'gift', 'travel']),
  limit: z.coerce.number().min(0, 'Must be positive'),
  balance: z.coerce.number().min(0, 'Must be positive'),
  currency: z.string().min(1, 'Required'),
  expiry_date: z.string().min(1, 'Required'),
  is_active: z.boolean().default(true),
});

export type PrepaidCardFormData = z.infer<typeof prepaidCardSchema>;

export interface PrepaidCard {
  id: string;
  company_id: string;
  card_number: string;
  holder_name: string;
  type: 'corporate' | 'gift' | 'travel';
  limit: number;
  balance: number;
  currency: string;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Gift Card Liability ---
export interface GiftCardLiability {
  total_issued: number;
  total_used: number;
  total_expired: number;
  outstanding_liability: number;
}

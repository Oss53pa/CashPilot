import { supabase } from '@/config/supabase';

// ============================================================================
// Exchange Rate Service for Multi-Currency Support
// ============================================================================

export interface ExchangeRate {
  id: string;
  tenant_id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  source: string;
  created_at: string;
}

// Fixed rates for common XOF pairs (BCEAO peg + approximations)
const FIXED_RATES: Record<string, number> = {
  'XOF_EUR': 0.001524, // 1 XOF = 0.001524 EUR (peg: 1 EUR = 655.957 XOF)
  'EUR_XOF': 655.957,
  'XOF_USD': 0.001650,
  'USD_XOF': 606.06,
  'XOF_GBP': 0.001300,
  'GBP_XOF': 769.23,
  'XOF_XAF': 1.0, // XOF = XAF (same value, different zone)
  'XAF_XOF': 1.0,
  'EUR_USD': 1.0825,
  'USD_EUR': 0.9238,
};

/**
 * Get the exchange rate between two currencies for a given date.
 * Priority: 1) DB rate for exact date, 2) DB rate nearest date, 3) Fixed/peg rate
 */
export async function getRate(
  fromCurrency: string,
  toCurrency: string,
  date?: string
): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  const rateDate = date || new Date().toISOString().split('T')[0];

  // Try exact date from DB
  const { data: exactRate } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .eq('rate_date', rateDate)
    .limit(1)
    .single();

  if (exactRate) return exactRate.rate as number;

  // Try nearest date from DB (within 7 days)
  const { data: nearestRate } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .lte('rate_date', rateDate)
    .order('rate_date', { ascending: false })
    .limit(1)
    .single();

  if (nearestRate) return nearestRate.rate as number;

  // Try inverse rate
  const { data: inverseRate } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', toCurrency)
    .eq('to_currency', fromCurrency)
    .lte('rate_date', rateDate)
    .order('rate_date', { ascending: false })
    .limit(1)
    .single();

  if (inverseRate) return 1 / (inverseRate.rate as number);

  // Fallback to fixed rates
  const key = `${fromCurrency}_${toCurrency}`;
  if (FIXED_RATES[key]) return FIXED_RATES[key];

  // Try cross rate via EUR
  const fromEur = FIXED_RATES[`${fromCurrency}_EUR`];
  const eurTo = FIXED_RATES[`EUR_${toCurrency}`];
  if (fromEur && eurTo) return fromEur * eurTo;

  // Last resort
  console.warn(`No exchange rate found for ${fromCurrency}/${toCurrency}`);
  return 1;
}

/**
 * Convert an amount from one currency to another.
 */
export async function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date?: string
): Promise<{ converted: number; rate: number }> {
  const rate = await getRate(fromCurrency, toCurrency, date);
  return {
    converted: Math.round(amount * rate),
    rate,
  };
}

/**
 * Save a manual exchange rate.
 */
export async function saveRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  rateDate: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single();

  const { error } = await supabase
    .from('exchange_rates')
    .upsert({
      tenant_id: profile?.tenant_id,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate,
      rate_date: rateDate,
      source: 'manual',
    }, {
      onConflict: 'tenant_id,from_currency,to_currency,rate_date',
    });

  if (error) throw error;

  // Also save inverse rate
  await supabase
    .from('exchange_rates')
    .upsert({
      tenant_id: profile?.tenant_id,
      from_currency: toCurrency,
      to_currency: fromCurrency,
      rate: 1 / rate,
      rate_date: rateDate,
      source: 'manual',
    }, {
      onConflict: 'tenant_id,from_currency,to_currency,rate_date',
    });
}

/**
 * Get rate history for a currency pair.
 */
export async function getRateHistory(
  fromCurrency: string,
  toCurrency: string,
  limit = 90
): Promise<ExchangeRate[]> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .order('rate_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as ExchangeRate[];
}

/**
 * Get all available rates for a date.
 */
export async function getRatesForDate(date: string): Promise<ExchangeRate[]> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('rate_date', date)
    .order('from_currency');

  if (error) throw error;
  return data as ExchangeRate[];
}

/**
 * Common UEMOA/CEMAC currencies list.
 */
export const CURRENCIES = [
  { code: 'XOF', name: 'Franc CFA BCEAO', symbol: 'FCFA', zone: 'UEMOA' },
  { code: 'XAF', name: 'Franc CFA BEAC', symbol: 'FCFA', zone: 'CEMAC' },
  { code: 'EUR', name: 'Euro', symbol: '€', zone: 'EU' },
  { code: 'USD', name: 'Dollar US', symbol: '$', zone: 'US' },
  { code: 'GBP', name: 'Livre Sterling', symbol: '£', zone: 'UK' },
  { code: 'GNF', name: 'Franc Guineen', symbol: 'GNF', zone: 'Guinee' },
  { code: 'NGN', name: 'Naira', symbol: '₦', zone: 'Nigeria' },
  { code: 'GHS', name: 'Cedi', symbol: 'GH₵', zone: 'Ghana' },
  { code: 'MAD', name: 'Dirham Marocain', symbol: 'MAD', zone: 'Maroc' },
] as const;

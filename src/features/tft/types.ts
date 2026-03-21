// ---------------------------------------------------------------------------
// TFT (Tableau de Flux de Tresorerie) — Types
// ---------------------------------------------------------------------------

/** TFT Line item */
export interface TFTLineItem {
  code: string; // A1, A2, A3, A4, A5, B1, B2, B3, B4, C1, C2, C3
  label: string;
  children?: TFTLineItem[];
  current_period: number;
  previous_period: number;
  budget?: number;
  variance_amount?: number; // computed
  variance_pct?: number; // computed
  is_subtotal?: boolean;
  is_total?: boolean;
  sign: '+' | '-';
}

/** TFT Section */
export interface TFTSection {
  code: 'A' | 'B' | 'C' | 'D' | 'E';
  title: string;
  receipts: TFTLineItem[];
  disbursements: TFTLineItem[];
  total_receipts: number;
  total_disbursements: number;
  net_flow: number;
  net_flow_previous: number;
}

/** Position breakdown by instrument type */
export interface PositionBreakdown {
  bank: number;
  cash: number;
  mobile_money: number;
  prepaid: number;
  overdraft: number;
}

/** Full TFT Statement */
export interface TFTStatement {
  id: string;
  company_id: string;
  company_name: string;
  period_start: string;
  period_end: string;
  period_type: 'monthly' | 'quarterly' | 'annual';
  method: 'direct' | 'indirect';
  statement_type: 'realized' | 'forecast' | 'hybrid';
  scope: 'company' | 'group';
  currency: string;
  sections: {
    exploitation: TFTSection; // A
    investment: TFTSection; // B
    financing: TFTSection; // C
  };
  reconciliation: {
    net_exploitation: number;
    net_investment: number;
    net_financing: number;
    net_variation: number;
    opening_position: number;
    opening_breakdown: PositionBreakdown;
    closing_position: number;
    closing_breakdown: PositionBreakdown;
    reconciliation_variance: number; // should be 0
  };
  complementary: {
    non_cash_items: { label: string; amount: number }[];
    significant_flows: { label: string; amount: number; nature: string }[];
    ratios: {
      operating_cf_to_revenue: number;
      free_cash_flow: number;
      days_cash_on_hand: number;
      dscr: number;
      cash_conversion: number;
      burn_rate?: number;
    };
  };
  is_certified: boolean;
  certified_by?: string;
  certified_at?: string;
}

/** Classification rule mapping categories to TFT lines */
export interface TFTClassificationRule {
  category: string;
  section: 'A' | 'B' | 'C';
  line: string;
  sign: '+' | '-';
}

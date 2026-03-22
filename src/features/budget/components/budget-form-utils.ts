import { formatFCFA as _formatFCFA } from "@/utils/currency";

// ─── Constants ───────────────────────────────────────────────────────────────

export const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  in_review: "En validation",
  validated: "Validé",
  archived: "Archivé",
};

export const TYPE_LABELS: Record<string, string> = {
  annual_fixed: "Annuel fixe",
  rolling: "Glissant",
  project: "Par projet",
};

export const SCOPE_LABELS: Record<string, string> = {
  company: "Société seule",
  consolidated: "Groupe consolidé",
};

export const CURRENCY_LABELS: Record<string, string> = {
  XOF: "XOF (FCFA BCEAO)",
  XAF: "XAF (FCFA BEAC)",
  EUR: "EUR (Euro)",
  USD: "USD (Dollar US)",
};

export const DISTRIBUTION_LABELS: Record<string, string> = {
  equal: "Égal (1/12)",
  seasonal: "Saisonnier",
  progressive: "Progressif",
  manual: "Manuel",
};

export const CATEGORY_COLORS: Record<string, string> = {
  revenue: "bg-green-50 dark:bg-green-950/30",
  opex: "bg-red-50 dark:bg-red-950/20",
  financial: "bg-orange-50 dark:bg-orange-950/20",
  capex: "bg-blue-50 dark:bg-blue-950/20",
  loan_repayment: "bg-purple-50 dark:bg-purple-950/20",
};

export const APPROVAL_STATUS_CONFIG: Record<
  string,
  {
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning";
    label: string;
  }
> = {
  pending: { variant: "secondary", label: "En attente" },
  approved: { variant: "success", label: "Approuvé" },
  rejected: { variant: "destructive", label: "Rejeté" },
  skipped: { variant: "outline", label: "Passé" },
};

// ─── FCFA Formatting (delegated to @/utils/currency) ────────────────────────

/** Format centimes as francs (no suffix). Used for form inputs. */
export function formatFCFA(centimes: number): string {
  return _formatFCFA(centimes, { suffix: false });
}

/** Alias for formatFCFA — same logic. */
export const formatFCFADisplay = formatFCFA;

/** Format centimes as compact francs (K / M) without suffix. */
export function formatFCFACompact(centimes: number): string {
  return _formatFCFA(centimes, { compact: true, suffix: false });
}

// ─── Compute end date from start ─────────────────────────────────────────────

export function computeEndDate(startDate: string): string {
  if (!startDate) return "";
  const d = new Date(startDate);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ─── Types for shared state ─────────────────────────────────────────────────

export interface BaseTotals {
  revenues: number;
  charges: number;
  net: number;
}

export interface BudgetFormRefs {
  companies: Array<{ id: string; name: string }>;
  users: Array<{ id: string; name: string }>;
  costCenters: string[];
  budgetsList: Array<{ id: string; name: string; fiscal_year: number }>;
  counterpartiesList: Array<{ id: string; name: string }>;
}

import type {
  TenantLegalForm,
  TenantStatus,
  EmployeeCount,
  LeaseType,
  Periodicity,
  FullIndexationType,
  DeclaredRevenueStatus,
  TenantWorkStatus,
  TenantDisputeStatus,
  InstallmentPlanStatus,
} from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ─── Label maps ──────────────────────────────────────────────────────────────

export const LEGAL_FORM_LABELS: Record<TenantLegalForm, string> = {
  sarl: "SARL",
  sa: "SA",
  sas: "SAS",
  ei: "Entreprise Individuelle",
  association: "Association",
  other: "Autre",
};

export const STATUS_LABELS: Record<TenantStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  negotiating: "En negociation",
  pre_lease: "Pre-bail",
  suspended: "Suspendu",
};

export const STATUS_VARIANTS: Record<
  TenantStatus,
  "success" | "destructive" | "warning" | "secondary" | "default"
> = {
  active: "success",
  inactive: "destructive",
  negotiating: "warning",
  pre_lease: "secondary",
  suspended: "destructive",
};

export const EMPLOYEE_COUNT_LABELS: Record<EmployeeCount, string> = {
  "1-5": "1 - 5",
  "6-20": "6 - 20",
  "21-50": "21 - 50",
  "51-200": "51 - 200",
  "200+": "200+",
};

export const LEASE_TYPE_LABELS: Record<LeaseType, string> = {
  befa: "BEFA (Bail en Etat Futur)",
  commercial: "Commercial",
  precarious: "Precaire",
  temporary: "Temporaire",
};

export const PERIODICITY_LABELS: Record<Periodicity, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  semi_annual: "Semestriel",
};

export const INDEXATION_TYPE_LABELS: Record<FullIndexationType, string> = {
  none: "Aucune",
  fixed_rate: "Taux fixe",
  external_index: "Indice externe (IRL/ICC)",
  contractual_step: "Palier contractuel",
};

export const DECLARED_STATUS_LABELS: Record<DeclaredRevenueStatus, string> = {
  declared: "Declare",
  verified: "Verifie",
  disputed: "Conteste",
  audited: "Audite",
};

export const WORK_STATUS_LABELS: Record<TenantWorkStatus, string> = {
  pending: "En attente",
  authorized: "Autorise",
  refused: "Refuse",
  in_progress: "En cours",
  completed: "Termine",
};

export const WORK_STATUS_VARIANTS: Record<
  TenantWorkStatus,
  "success" | "destructive" | "warning" | "secondary" | "default"
> = {
  pending: "warning",
  authorized: "success",
  refused: "destructive",
  in_progress: "default",
  completed: "secondary",
};

export const DISPUTE_STATUS_LABELS: Record<TenantDisputeStatus, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  settled: "Regle",
  closed: "Clos",
  written_off: "Passe en perte",
};

export const INSTALLMENT_STATUS_LABELS: Record<InstallmentPlanStatus, string> =
  {
    active: "Actif",
    completed: "Termine",
    defaulted: "Defaut",
  };

export const AVAILABLE_TAGS = [
  "Ancre",
  "Premium",
  "International",
  "Grande Surface",
  "Telecom",
  "Banque",
  "Restauration",
  "Mode",
  "Automobile",
  "Contentieux",
  "VIP",
  "PME",
  "Franchise",
];

// ─── Reusable Field Components ──────────────────────────────────────────────

import React from "react";
import { Label } from "@/components/ui/label";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground mb-1 block">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function ReadonlyField({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value ?? "-"}</p>
    </div>
  );
}

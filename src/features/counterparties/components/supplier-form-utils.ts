import type {
  SupplierIdentity,
  SupplierReferencing,
  SupplierContract,
  SupplierBankAccount,
  SupplierScorecard,
  SupplierTransaction,
  PaymentProfile,
  SupplierCategory,
  SupplierStatus,
  SupplierCriticality,
  ReferencingStatus,
  RelationshipType,
  PaymentBase,
} from "../types";

// ─── Constants ───────────────────────────────────────────────────────────────

export const SUPPLIER_CATEGORIES: { value: SupplierCategory; label: string }[] =
  [
    { value: "maintenance", label: "Maintenance" },
    { value: "energy", label: "Énergie" },
    { value: "security", label: "Sécurité" },
    { value: "cleaning", label: "Nettoyage" },
    { value: "personnel", label: "Personnel" },
    { value: "consulting", label: "Conseil" },
    { value: "equipment", label: "Équipement" },
    { value: "utilities", label: "Services publics" },
    { value: "works", label: "Travaux" },
    { value: "other", label: "Autre" },
  ];

export const SUPPLIER_STATUSES: {
  value: SupplierStatus;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}[] = [
  { value: "active", label: "Actif", variant: "default" },
  { value: "inactive", label: "Inactif", variant: "secondary" },
  { value: "suspended", label: "Suspendu", variant: "destructive" },
  { value: "in_dispute", label: "En litige", variant: "destructive" },
  {
    value: "being_referenced",
    label: "En cours de référencement",
    variant: "outline",
  },
];

export const CRITICALITY_LEVELS: {
  value: SupplierCriticality;
  label: string;
  color: string;
}[] = [
  { value: "critical", label: "Critique", color: "text-red-600" },
  { value: "important", label: "Important", color: "text-orange-500" },
  { value: "standard", label: "Standard", color: "text-gray-600" },
];

export const REFERENCING_STATUSES: {
  value: ReferencingStatus;
  label: string;
}[] = [
  { value: "in_progress", label: "En cours" },
  { value: "approved", label: "Approuvé" },
  { value: "refused", label: "Refusé" },
  { value: "suspended", label: "Suspendu" },
];

export const REQUIRED_DOCUMENTS = [
  "Extrait RCCM",
  "Attestation fiscale",
  "Attestation CNPS",
  "RIB bancaire",
  "Certificat d'assurance",
  "Références clients",
  "Certificat de qualité",
  "Attestation de régularité",
];

export const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] =
  [
    { value: "annual", label: "Annuel" },
    { value: "multi_year", label: "Pluriannuel" },
    { value: "spot", label: "Ponctuel" },
    { value: "framework", label: "Accord-cadre" },
  ];

export const PAYMENT_BASES: { value: PaymentBase; label: string }[] = [
  { value: "invoice_receipt", label: "Réception facture" },
  { value: "month_end", label: "Fin de mois" },
  { value: "service_date", label: "Date de prestation" },
];

export const PAYMENT_METHOD_OPTIONS = [
  "Virement bancaire",
  "Chèque",
  "Espèces",
  "Mobile Money",
  "Traite",
  "Lettre de change",
];

export const SCORECARD_CRITERIA = [
  "Qualité de service",
  "Respect des délais",
  "Réactivité",
  "Rapport qualité/prix",
  "Conformité documentaire",
  "Communication",
];

export const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(n);

// ─── Mock data factories ─────────────────────────────────────────────────────

export function getDefaultIdentity(): SupplierIdentity {
  return {
    legal_name: "SOGECI MAINTENANCE SARL",
    trade_name: "SOGECI",
    legal_form: "SARL",
    rc_number: "CI-ABJ-2018-B-12456",
    tax_number: "1824567A",
    vat_number: "CI0018245670",
    category: "maintenance",
    sub_category: "Climatisation & Plomberie",
    commercial_contact: "M. Koné Ibrahim",
    phone: "+225 07 08 09 10 11",
    email: "contact@sogeci.ci",
    billing_contact: "Mme Touré Aminata",
    billing_email: "facturation@sogeci.ci",
    address: "Zone Industrielle Vridi, Abidjan",
    country: "Côte d'Ivoire",
    billing_currency: "XOF",
    status: "active",
    criticality: "important",
    backup_supplier_id: undefined,
    annual_cap: 120_000_000,
    conflict_of_interest: false,
    conflict_detail: undefined,
    notes: "Fournisseur référencé depuis 2018. Bonne performance globale.",
  };
}

export function getDefaultReferencing(): SupplierReferencing {
  return {
    referencing_status: "approved",
    request_date: "2018-03-15",
    approval_date: "2018-04-20",
    approved_by: "Direction Achats",
    documents: REQUIRED_DOCUMENTS.map((type, i) => ({
      type,
      file: i < 6 ? `doc_${i + 1}.pdf` : undefined,
      provided: i < 6,
    })),
    tender_ref: "AO-2024-MAINT-003",
    tender_date: "2024-01-15",
    tender_result: "selected",
    tender_justification:
      "Meilleur rapport qualité/prix sur 5 soumissionnaires",
    subject_to_rotation: true,
    rotation_frequency: "triennial",
    next_tender_date: "2027-01-15",
  };
}

export function getDefaultContract(): SupplierContract {
  return {
    relationship_type: "annual",
    contract_ref: "CTR-2024-MAINT-001",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    tacit_renewal: true,
    notice_days: 90,
    contract_alert_days: 60,
    contract_file: "contrat_sogeci_2024.pdf",
    annual_amount: 96_000_000,
    monthly_amount: 8_000_000,
    billing_frequency: "Mensuelle",
    vat_applicable: true,
    vat_rate: 18,
    payment_delay_days: 30,
    payment_base: "invoice_receipt",
    early_payment_discount: true,
    discount_rate: 2,
    discount_delay: 10,
    late_penalty_rate: 1.5,
    payment_methods: ["Virement bancaire"],
    default_account_id: "acc-001",
    has_retention: true,
    retention_rate: 5,
    retention_duration_months: 12,
    retention_release_conditions:
      "Levée des réserves et PV de réception définitive",
  };
}

export function getDefaultBankAccounts(): SupplierBankAccount[] {
  return [
    {
      id: "ba-001",
      bank_name: "Société Générale CI",
      bank_country: "Côte d'Ivoire",
      iban: "CI93 CI05 0001 0000 1234 5678 9012",
      bic_swift: "SGCICIAB",
      account_holder: "SOGECI MAINTENANCE SARL",
      currency: "XOF",
      is_primary: true,
      verification_date: "2024-01-10",
      verified_by: "DAF - M. Diallo",
      verification_method: "Confirmation bancaire",
      verification_document: "verif_rib_sogeci.pdf",
    },
    {
      id: "ba-002",
      bank_name: "BICICI",
      bank_country: "Côte d'Ivoire",
      iban: "CI93 CI02 0001 0000 9876 5432 1098",
      bic_swift: "BICICIAB",
      account_holder: "SOGECI MAINTENANCE SARL",
      currency: "XOF",
      is_primary: false,
      verification_date: undefined,
      verified_by: undefined,
      verification_method: undefined,
      verification_document: undefined,
    },
  ];
}

export function getDefaultPaymentProfile(): PaymentProfile {
  return {
    counterparty_id: "sup-001",
    avg_delay_days: -3.2,
    delay_std_dev: 2.1,
    full_payment_rate: 0.95,
    partial_payment_rate: 0.04,
    avg_partial_amount_pct: 0.88,
    history_months: 24,
    trend: "stable",
    vigilance_status: "normal",
    risk_score: 2,
    forced_delay: null,
  };
}

export function getDefaultScorecards(): SupplierScorecard[] {
  return [
    {
      id: "sc-001",
      criteria: [
        {
          name: "Qualité de service",
          score: 4,
          comment: "Bon niveau de prestation",
        },
        {
          name: "Respect des délais",
          score: 3,
          comment: "Quelques retards ponctuels",
        },
        { name: "Réactivité", score: 4 },
        { name: "Rapport qualité/prix", score: 4, comment: "Compétitif" },
        {
          name: "Conformité documentaire",
          score: 5,
          comment: "Toujours à jour",
        },
        { name: "Communication", score: 4 },
      ],
      overall_score: 4.0,
      evaluator_id: "user-001",
      evaluation_date: "2025-12-15",
      period: "2025",
      recommendation: "renew",
    },
    {
      id: "sc-002",
      criteria: [
        { name: "Qualité de service", score: 3 },
        { name: "Respect des délais", score: 3 },
        { name: "Réactivité", score: 3 },
        { name: "Rapport qualité/prix", score: 4 },
        { name: "Conformité documentaire", score: 4 },
        { name: "Communication", score: 3 },
      ],
      overall_score: 3.3,
      evaluator_id: "user-002",
      evaluation_date: "2024-12-10",
      period: "2024",
      recommendation: "renew",
    },
  ];
}

export function getDefaultTransactions(): SupplierTransaction[] {
  return [
    {
      id: "tx-001",
      date: "2026-03-05",
      type: "invoice",
      reference: "FAC-2026-0301",
      description: "Maintenance climatisation Mars 2026",
      amount: 8_000_000,
      status: "pending",
    },
    {
      id: "tx-002",
      date: "2026-02-28",
      type: "payment",
      reference: "VIR-2026-0215",
      description: "Règlement facture Février 2026",
      amount: 8_000_000,
      status: "paid",
    },
    {
      id: "tx-003",
      date: "2026-02-05",
      type: "invoice",
      reference: "FAC-2026-0201",
      description: "Maintenance climatisation Février 2026",
      amount: 8_000_000,
      status: "paid",
    },
    {
      id: "tx-004",
      date: "2026-01-30",
      type: "payment",
      reference: "VIR-2026-0125",
      description: "Règlement facture Janvier 2026",
      amount: 8_000_000,
      status: "paid",
    },
    {
      id: "tx-005",
      date: "2026-01-05",
      type: "invoice",
      reference: "FAC-2026-0101",
      description: "Maintenance climatisation Janvier 2026",
      amount: 8_000_000,
      status: "paid",
    },
    {
      id: "tx-006",
      date: "2025-12-20",
      type: "credit_note",
      reference: "AV-2025-012",
      description: "Avoir - intervention non réalisée",
      amount: 1_200_000,
      status: "paid",
    },
    {
      id: "tx-007",
      date: "2025-12-05",
      type: "invoice",
      reference: "FAC-2025-1201",
      description: "Maintenance climatisation Décembre 2025",
      amount: 8_000_000,
      status: "paid",
    },
    {
      id: "tx-008",
      date: "2025-11-28",
      type: "payment",
      reference: "VIR-2025-1115",
      description: "Règlement facture Novembre 2025",
      amount: 8_000_000,
      status: "paid",
    },
    {
      id: "tx-009",
      date: "2025-06-15",
      type: "advance",
      reference: "AV-2025-006",
      description: "Acompte travaux climatisation bât. B",
      amount: 15_000_000,
      status: "paid",
    },
    {
      id: "tx-010",
      date: "2025-03-10",
      type: "invoice",
      reference: "FAC-2025-0301",
      description: "Remplacement compresseur central",
      amount: 22_000_000,
      status: "overdue",
    },
  ];
}

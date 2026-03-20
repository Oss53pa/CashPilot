// ─── Shared / Legacy Types ───────────────────────────────────────────────────

export interface DashboardSummary {
  totalBalance: number;
  monthReceipts: number;
  monthDisbursements: number;
  netCashFlow: number;
  pendingPayments: number;
  alertsCount: number;
}

export interface CashFlowTrendItem {
  date: string;
  receipts: number;
  disbursements: number;
  net: number;
}

export interface TopCategory {
  name: string;
  value: number;
}

export interface RecentTransaction {
  id: string;
  date: string;
  type: 'receipt' | 'disbursement';
  category: string;
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'validated' | 'reconciled';
}

// ─── CEO Dashboard Types ─────────────────────────────────────────────────────

export interface CEOAlert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  date: string;
}

export interface BudgetVsActualItem {
  category: string;
  type: 'revenue' | 'expense';
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface DelinquentTenant {
  id: string;
  name: string;
  amountDue: number;
  daysOverdue: number;
  severity: 'critical' | 'warning' | 'info';
}

export interface PendingApproval {
  id: string;
  description: string;
  amount: number;
  requestedBy: string;
  date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface EntityBreakdown {
  id: string;
  companyName: string;
  position: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface CEODashboardData {
  consolidatedPosition: number;
  forecastJ30: number;
  forecastJ90: number;
  alerts: CEOAlert[];
  budgetVsActual: BudgetVsActualItem[];
  delinquentTenants: DelinquentTenant[];
  pendingApprovals: PendingApproval[];
  entityBreakdown: EntityBreakdown[];
}

// ─── CFO Dashboard Types ─────────────────────────────────────────────────────

export interface BankPositionItem {
  id: string;
  accountName: string;
  bankName: string;
  realBalance: number;
  forecastJ7: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface WeeklyPlanItem {
  week: string;
  receipts: number;
  disbursements: number;
  net: number;
}

export interface DailyActionCounts {
  unidentifiedFlows: number;
  missingCashCounts: number;
  pendingApprovals: number;
  missingBankImports: number;
}

export interface VATDue {
  amount: number;
  deadline: string;
  daysRemaining: number;
}

export interface FinancialRatio {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export interface CFODashboardData {
  bankPositions: BankPositionItem[];
  weeklyPlan: WeeklyPlanItem[];
  dailyActions: DailyActionCounts;
  vatDue: VATDue;
  financialRatios: FinancialRatio[];
}

// ─── Treasurer Dashboard Types ───────────────────────────────────────────────

export interface ToProcessItem {
  key: 'receiptsToMatch' | 'unidentifiedFlows' | 'pendingCashCounts' | 'overdueJustifications';
  label: string;
  count: number;
  icon: string;
}

export interface DeadlineItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  bankAccount: string;
}

export interface TreasurerDashboardData {
  toProcess: ToProcessItem[];
  deadlines: DeadlineItem[];
}

// ─── Center Manager Dashboard Types ──────────────────────────────────────────

export interface TenantFollowUp {
  id: string;
  name: string;
  amountDue: number;
  daysOverdue: number;
  severity: 'critical' | 'warning' | 'info';
  lastAction: string;
}

export interface CashRegisterStatus {
  id: string;
  name: string;
  balance: number;
  status: 'open' | 'closed' | 'discrepancy';
}

export interface TenantStatusBreakdown {
  upToDate: number;
  late: number;
  dispute: number;
  vacant: number;
  total: number;
}

export interface CenterManagerDashboardData {
  followUps: TenantFollowUp[];
  cashRegisters: CashRegisterStatus[];
  tenantStatus: TenantStatusBreakdown;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const dashboardService = {
  // Legacy methods kept for backward compatibility
  async getSummary(_companyId: string): Promise<DashboardSummary> {
    return {
      totalBalance: 245_800_000,
      monthReceipts: 78_500_000,
      monthDisbursements: 52_300_000,
      netCashFlow: 26_200_000,
      pendingPayments: 12,
      alertsCount: 3,
    };
  },

  async getCashFlowTrend(_companyId: string, months: number = 6): Promise<CashFlowTrendItem[]> {
    const data: CashFlowTrendItem[] = [
      { date: 'Oct 2025', receipts: 65_200_000, disbursements: 48_100_000, net: 17_100_000 },
      { date: 'Nov 2025', receipts: 72_400_000, disbursements: 55_800_000, net: 16_600_000 },
      { date: 'Dec 2025', receipts: 89_100_000, disbursements: 71_200_000, net: 17_900_000 },
      { date: 'Jan 2026', receipts: 68_300_000, disbursements: 51_400_000, net: 16_900_000 },
      { date: 'Feb 2026', receipts: 74_600_000, disbursements: 49_800_000, net: 24_800_000 },
      { date: 'Mar 2026', receipts: 78_500_000, disbursements: 52_300_000, net: 26_200_000 },
    ];
    return data.slice(-months);
  },

  async getTopCategories(_companyId: string): Promise<TopCategory[]> {
    return [
      { name: 'Ventes', value: 42_500_000 },
      { name: 'Salaires', value: 18_200_000 },
      { name: 'Loyers', value: 8_500_000 },
      { name: 'Fournisseurs', value: 12_800_000 },
      { name: 'Transport', value: 5_400_000 },
      { name: 'Taxes & Impôts', value: 6_100_000 },
      { name: 'Services', value: 3_200_000 },
      { name: 'Autres', value: 2_800_000 },
    ];
  },

  async getRecentTransactions(_companyId: string, limit: number = 10): Promise<RecentTransaction[]> {
    const transactions: RecentTransaction[] = [
      { id: '1', date: '2026-03-18', type: 'receipt', category: 'Ventes', description: 'Paiement client - SOTRA', amount: 12_500_000, currency: 'XOF', status: 'validated' },
      { id: '2', date: '2026-03-17', type: 'disbursement', category: 'Salaires', description: 'Paie Mars 2026 - Lot 1', amount: 8_200_000, currency: 'XOF', status: 'validated' },
      { id: '3', date: '2026-03-17', type: 'receipt', category: 'Ventes', description: 'Facture #2026-0342 - CFAO Motors', amount: 5_800_000, currency: 'XOF', status: 'reconciled' },
      { id: '4', date: '2026-03-16', type: 'disbursement', category: 'Fournisseurs', description: 'Achat matières premières - Nestlé CI', amount: 4_200_000, currency: 'XOF', status: 'validated' },
      { id: '5', date: '2026-03-16', type: 'disbursement', category: 'Loyers', description: 'Loyer bureau Plateau - Mars 2026', amount: 2_500_000, currency: 'XOF', status: 'validated' },
    ];
    return transactions.slice(0, limit);
  },

  // ─── CEO Dashboard ──────────────────────────────────────────────────────────

  async getCEODashboard(_tenantId: string): Promise<CEODashboardData> {
    return {
      consolidatedPosition: 1_245_800_000,
      forecastJ30: 1_312_500_000,
      forecastJ90: 1_485_200_000,
      alerts: [
        {
          id: 'a1',
          title: 'Seuil critique atteint - Compte SGBCI',
          message: 'Le solde du compte SGBCI Plateau est passé sous le seuil minimum de 5 000 000 FCFA.',
          severity: 'critical',
          date: '2026-03-19',
        },
        {
          id: 'a2',
          title: 'Dépassement budgétaire - Charges Cocody',
          message: 'Les charges du centre Cocody dépassent le budget de 18% sur le mois en cours.',
          severity: 'warning',
          date: '2026-03-18',
        },
        {
          id: 'a3',
          title: 'Échéance prêt BOAD dans 5 jours',
          message: 'Remboursement trimestriel de 45 000 000 FCFA dû le 24 mars 2026.',
          severity: 'warning',
          date: '2026-03-19',
        },
        {
          id: 'a4',
          title: 'Nouveau locataire en retard - Pharmacie du Plateau',
          message: 'Premier impayé détecté : loyer mars 2026 non réglé depuis 4 jours.',
          severity: 'info',
          date: '2026-03-19',
        },
      ],
      budgetVsActual: [
        { category: 'Loyers encaissés', type: 'revenue', budget: 85_000_000, actual: 72_300_000, variance: -12_700_000, variancePercent: -14.9 },
        { category: 'Charges locatives', type: 'revenue', budget: 12_000_000, actual: 11_200_000, variance: -800_000, variancePercent: -6.7 },
        { category: 'Revenus parking', type: 'revenue', budget: 5_500_000, actual: 6_100_000, variance: 600_000, variancePercent: 10.9 },
        { category: 'Entretien bâtiments', type: 'expense', budget: 15_000_000, actual: 17_700_000, variance: -2_700_000, variancePercent: -18.0 },
        { category: 'Salaires & charges', type: 'expense', budget: 22_000_000, actual: 21_800_000, variance: 200_000, variancePercent: 0.9 },
        { category: 'Assurances', type: 'expense', budget: 8_500_000, actual: 8_500_000, variance: 0, variancePercent: 0.0 },
      ],
      delinquentTenants: [
        { id: 't1', name: 'Groupe Ivoire Textile', amountDue: 18_500_000, daysOverdue: 47, severity: 'critical' },
        { id: 't2', name: 'Restaurant Le Bélier', amountDue: 4_200_000, daysOverdue: 22, severity: 'warning' },
        { id: 't3', name: 'Pharmacie du Plateau', amountDue: 2_800_000, daysOverdue: 4, severity: 'info' },
      ],
      pendingApprovals: [
        { id: 'p1', description: 'Remplacement climatisation - Immeuble Cocody', amount: 12_500_000, requestedBy: 'Kouamé Serge', date: '2026-03-17', priority: 'high' },
        { id: 'p2', description: 'Paiement fournisseur sécurité - G4S', amount: 7_800_000, requestedBy: 'Diabaté Awa', date: '2026-03-18', priority: 'medium' },
        { id: 'p3', description: 'Renouvellement assurance multirisque', amount: 15_200_000, requestedBy: 'Traoré Ibrahima', date: '2026-03-16', priority: 'urgent' },
        { id: 'p4', description: 'Achat mobilier bureau - Agence Marcory', amount: 3_400_000, requestedBy: 'N\'Guessan Marie', date: '2026-03-19', priority: 'low' },
      ],
      entityBreakdown: [
        { id: 'e1', companyName: 'SCI Plateau Tower', position: 485_200_000, status: 'healthy' },
        { id: 'e2', companyName: 'SCI Cocody Business Park', position: 312_600_000, status: 'healthy' },
        { id: 'e3', companyName: 'SCI Marcory Centre', position: 198_400_000, status: 'warning' },
        { id: 'e4', companyName: 'SCI Riviera Résidences', position: 156_800_000, status: 'healthy' },
        { id: 'e5', companyName: 'SCI Zone 4 Commercial', position: 92_800_000, status: 'critical' },
      ],
    };
  },

  // ─── CFO Dashboard ──────────────────────────────────────────────────────────

  async getCFODashboard(_companyId: string): Promise<CFODashboardData> {
    return {
      bankPositions: [
        { id: 'b1', accountName: 'Compte courant principal', bankName: 'SGBCI', realBalance: 145_200_000, forecastJ7: 132_800_000, status: 'healthy' },
        { id: 'b2', accountName: 'Compte exploitation', bankName: 'BICICI', realBalance: 68_400_000, forecastJ7: 72_100_000, status: 'healthy' },
        { id: 'b3', accountName: 'Compte séquestre loyers', bankName: 'Ecobank', realBalance: 42_600_000, forecastJ7: 38_200_000, status: 'warning' },
        { id: 'b4', accountName: 'Compte devises', bankName: 'SIB', realBalance: 28_100_000, forecastJ7: 28_100_000, status: 'healthy' },
        { id: 'b5', accountName: 'Caisse Plateau', bankName: 'Caisse', realBalance: 3_200_000, forecastJ7: 2_800_000, status: 'critical' },
      ],
      weeklyPlan: [
        { week: 'S12 (17-23 Mar)', receipts: 42_500_000, disbursements: 38_200_000, net: 4_300_000 },
        { week: 'S13 (24-30 Mar)', receipts: 35_800_000, disbursements: 52_100_000, net: -16_300_000 },
        { week: 'S14 (31 Mar-6 Avr)', receipts: 48_200_000, disbursements: 41_500_000, net: 6_700_000 },
        { week: 'S15 (7-13 Avr)', receipts: 38_900_000, disbursements: 35_200_000, net: 3_700_000 },
        { week: 'S16 (14-20 Avr)', receipts: 44_100_000, disbursements: 39_800_000, net: 4_300_000 },
        { week: 'S17 (21-27 Avr)', receipts: 36_500_000, disbursements: 42_300_000, net: -5_800_000 },
        { week: 'S18 (28 Avr-4 Mai)', receipts: 52_800_000, disbursements: 44_600_000, net: 8_200_000 },
        { week: 'S19 (5-11 Mai)', receipts: 41_200_000, disbursements: 38_900_000, net: 2_300_000 },
        { week: 'S20 (12-18 Mai)', receipts: 47_600_000, disbursements: 43_200_000, net: 4_400_000 },
        { week: 'S21 (19-25 Mai)', receipts: 39_800_000, disbursements: 36_500_000, net: 3_300_000 },
        { week: 'S22 (26 Mai-1 Juin)', receipts: 55_100_000, disbursements: 48_700_000, net: 6_400_000 },
        { week: 'S23 (2-8 Juin)', receipts: 43_400_000, disbursements: 40_100_000, net: 3_300_000 },
        { week: 'S24 (9-15 Juin)', receipts: 46_800_000, disbursements: 44_200_000, net: 2_600_000 },
      ],
      dailyActions: {
        unidentifiedFlows: 7,
        missingCashCounts: 2,
        pendingApprovals: 5,
        missingBankImports: 1,
      },
      vatDue: {
        amount: 14_850_000,
        deadline: '2026-04-15',
        daysRemaining: 27,
      },
      financialRatios: [
        { name: 'Days Cash on Hand', value: 42, unit: 'jours', status: 'good' },
        { name: 'DSO (Délai moyen encaissement)', value: 38, unit: 'jours', status: 'warning' },
        { name: 'Taux de recouvrement', value: 87.5, unit: '%', status: 'warning' },
        { name: 'DSCR (Ratio couverture dette)', value: 1.85, unit: 'x', status: 'good' },
      ],
    };
  },

  // ─── Treasurer Dashboard ────────────────────────────────────────────────────

  async getTreasurerDashboard(_companyId: string): Promise<TreasurerDashboardData> {
    return {
      toProcess: [
        { key: 'receiptsToMatch', label: 'Encaissements à rapprocher', count: 14, icon: 'receipt' },
        { key: 'unidentifiedFlows', label: 'Flux non identifiés', count: 7, icon: 'help-circle' },
        { key: 'pendingCashCounts', label: 'Arrêtés de caisse en attente', count: 3, icon: 'calculator' },
        { key: 'overdueJustifications', label: 'Justificatifs en retard', count: 5, icon: 'file-warning' },
      ],
      deadlines: [
        { id: 'd1', date: '2026-03-19', description: 'Virement loyer Q1 - Groupe Ivoire Textile', amount: 18_500_000, bankAccount: 'SGBCI - Compte courant' },
        { id: 'd2', date: '2026-03-20', description: 'Règlement fournisseur G4S (sécurité)', amount: 7_800_000, bankAccount: 'BICICI - Exploitation' },
        { id: 'd3', date: '2026-03-21', description: 'Prélèvement CIE (électricité centres)', amount: 4_200_000, bankAccount: 'SGBCI - Compte courant' },
        { id: 'd4', date: '2026-03-22', description: 'Échéance crédit-bail ascenseur Plateau', amount: 3_500_000, bankAccount: 'Ecobank - Séquestre' },
        { id: 'd5', date: '2026-03-24', description: 'Remboursement prêt BOAD - Tranche Q1', amount: 45_000_000, bankAccount: 'SGBCI - Compte courant' },
        { id: 'd6', date: '2026-03-25', description: 'Paiement prime assurance NSIA', amount: 8_500_000, bankAccount: 'BICICI - Exploitation' },
        { id: 'd7', date: '2026-03-25', description: 'Virement salaires Mars 2026 - Lot 2', amount: 12_400_000, bankAccount: 'SGBCI - Compte courant' },
      ],
    };
  },

  // ─── Center Manager Dashboard ───────────────────────────────────────────────

  async getCenterManagerDashboard(_companyId: string): Promise<CenterManagerDashboardData> {
    return {
      followUps: [
        { id: 'f1', name: 'Groupe Ivoire Textile', amountDue: 18_500_000, daysOverdue: 47, severity: 'critical', lastAction: 'Mise en demeure envoyée le 05/03' },
        { id: 'f2', name: 'Restaurant Le Bélier', amountDue: 4_200_000, daysOverdue: 22, severity: 'warning', lastAction: 'Relance téléphonique le 15/03' },
        { id: 'f3', name: 'Pharmacie du Plateau', amountDue: 2_800_000, daysOverdue: 4, severity: 'info', lastAction: 'Rappel email envoyé le 18/03' },
        { id: 'f4', name: 'Boutique Mode Élégance', amountDue: 1_500_000, daysOverdue: 12, severity: 'warning', lastAction: 'Visite prévue le 20/03' },
        { id: 'f5', name: 'Cabinet Avocat Koné & Associés', amountDue: 3_200_000, daysOverdue: 8, severity: 'info', lastAction: 'Promesse de paiement le 22/03' },
      ],
      cashRegisters: [
        { id: 'r1', name: 'Caisse Accueil Plateau', balance: 1_250_000, status: 'open' },
        { id: 'r2', name: 'Caisse Parking Cocody', balance: 680_000, status: 'open' },
        { id: 'r3', name: 'Caisse Services Généraux', balance: 420_000, status: 'discrepancy' },
        { id: 'r4', name: 'Caisse Maintenance', balance: 850_000, status: 'closed' },
      ],
      tenantStatus: {
        upToDate: 42,
        late: 8,
        dispute: 3,
        vacant: 5,
        total: 58,
      },
    };
  },
};

export const APP_NAME = 'CashPilot';
export const DEFAULT_CURRENCY = 'XOF';
export const DEFAULT_LOCALE = 'fr';
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
] as const;

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  children?: NavItem[];
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
  { key: 'cashflow', label: 'Cash Flow', icon: 'ArrowLeftRight', path: '/cashflow' },
  { key: 'accounts', label: 'Bank Accounts', icon: 'Landmark', path: '/accounts' },
  { key: 'forecast', label: 'Forecasts', icon: 'TrendingUp', path: '/forecast' },
  { key: 'budget', label: 'Budget', icon: 'PieChart', path: '/budget' },
  { key: 'payments', label: 'Payments', icon: 'CreditCard', path: '/payments' },
  { key: 'counterparties', label: 'Counterparties', icon: 'Users', path: '/counterparties' },
  { key: 'disputes', label: 'Disputes', icon: 'Scale', path: '/disputes' },
  { key: 'capex', label: 'CAPEX', icon: 'Building2', path: '/capex' },
  {
    key: 'financing',
    label: 'Financing',
    icon: 'Banknote',
    path: '/financing',
    children: [
      { key: 'debt', label: 'Debt', icon: 'FileText', path: '/financing/debt' },
      { key: 'investments', label: 'Investments', icon: 'Briefcase', path: '/financing/investments' },
      { key: 'credit-lines', label: 'Credit Lines', icon: 'ScrollText', path: '/financing/credit-lines' },
    ],
  },
  { key: 'taxes', label: 'Tax Obligations', icon: 'Receipt', path: '/taxes' },
  { key: 'reports', label: 'Reports', icon: 'BarChart3', path: '/reports' },
  { key: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
];

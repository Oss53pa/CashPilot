import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Landmark,
  Calculator,
  Settings,
  Calendar,
  Clock,
} from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';

const quickLinks = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'home.dashboard' as const, label: 'Tableau de bord' },
  { to: '/receipts', icon: ArrowDownToLine, labelKey: 'home.receipts' as const, label: 'Encaissements' },
  { to: '/disbursements', icon: ArrowUpFromLine, labelKey: 'home.disbursements' as const, label: 'Decaissements' },
  { to: '/forecast', icon: TrendingUp, labelKey: 'home.forecast' as const, label: 'Previsions' },
  { to: '/accounts', icon: Landmark, labelKey: 'home.accounts' as const, label: 'Comptes' },
  { to: '/budget', icon: Calculator, labelKey: 'home.budget' as const, label: 'Budget' },
  { to: '/settings', icon: Settings, labelKey: 'home.settings' as const, label: 'Parametres' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyName = currentCompany?.name ?? 'CashPilot';

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-6 py-12">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-2">
        <span className="text-sm text-muted-foreground">
          CashPilot — ADVIST
        </span>
        <Link
          to="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Tableau de bord <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Logo / Title */}
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">
            {companyName}
          </h1>
          <p className="mt-2 text-muted-foreground italic">
            {t('home.tagline', 'Votre plateforme de gestion de tresorerie intelligente')}
          </p>
        </div>

        {/* KPI Summary */}
        <div className="flex items-center divide-x divide-border">
          <div className="px-6 text-center">
            <p className="text-2xl font-semibold text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('home.transactions', 'Transactions')}
            </p>
          </div>
          <div className="px-6 text-center">
            <p className="text-2xl font-semibold text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('home.accounts_count', 'Comptes')}
            </p>
          </div>
          <div className="px-6 text-center">
            <p className="text-2xl font-semibold text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('home.counterparties', 'Tiers')}
            </p>
          </div>
          <div className="px-6 text-center">
            <p className="text-2xl font-semibold text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('home.alerts_count', 'Alertes')}
            </p>
          </div>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {t('home.fiscal_year', 'Exercice : Non defini')}
          </div>
          <div className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {t('home.last_activity', 'Derniere activite : Aucune')}
          </div>
        </div>
      </div>

      {/* Bottom quick links */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 rounded-full border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Powered by CashPilot / Atlas Studio
        </p>
      </div>
    </div>
  );
}

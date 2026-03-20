import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';


/**
 * Mapping of URL path segments to translation keys.
 * Extend this map as new routes are added.
 */
const SEGMENT_LABELS: Record<string, string> = {
  cashflow: 'breadcrumbs.cashflow',
  collections: 'breadcrumbs.collections',
  disbursements: 'breadcrumbs.disbursements',
  forecast: 'breadcrumbs.forecasts',
  accounts: 'breadcrumbs.accounts',
  'cash-mobile': 'breadcrumbs.cashMobile',
  budget: 'breadcrumbs.budget',
  counterparties: 'breadcrumbs.counterparties',
  transfers: 'breadcrumbs.transfers',
  capex: 'breadcrumbs.capex',
  financing: 'breadcrumbs.financing',
  debt: 'breadcrumbs.debt',
  investments: 'breadcrumbs.investments',
  'credit-lines': 'breadcrumbs.creditLines',
  disputes: 'breadcrumbs.disputes',
  taxes: 'breadcrumbs.taxes',
  approvals: 'breadcrumbs.approvals',
  reports: 'breadcrumbs.reports',
  audit: 'breadcrumbs.auditTrail',
  settings: 'breadcrumbs.settings',
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const { t } = useTranslation('common');

  // Build segments (filter empty strings from leading slash)
  const segments = pathname.split('/').filter(Boolean);

  // Nothing to show on the dashboard root
  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        <span className="ml-2 font-medium text-foreground">{t('sidebar.dashboard', 'Dashboard')}</span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground overflow-hidden">
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors shrink-0"
      >
        <Home className="h-4 w-4" />
      </Link>

      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const labelKey = SEGMENT_LABELS[segment];
        const label = labelKey
          ? t(labelKey, segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
          : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

        return (
          <span key={path} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground truncate">{label}</span>
            ) : (
              <Link
                to={path}
                className="hover:text-foreground transition-colors truncate"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

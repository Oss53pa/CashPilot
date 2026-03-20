import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// French locale files
import frCommon from '@/locales/fr/common.json';
import frAuth from '@/locales/fr/auth.json';
import frDashboard from '@/locales/fr/dashboard.json';
import frAccounts from '@/locales/fr/accounts.json';
import frBudget from '@/locales/fr/budget.json';
import frForecast from '@/locales/fr/forecast.json';
import frCashflow from '@/locales/fr/cashflow.json';
import frCounterparties from '@/locales/fr/counterparties.json';
import frSettings from '@/locales/fr/settings.json';
import frReports from '@/locales/fr/reports.json';
import frDisputes from '@/locales/fr/disputes.json';
import frCapex from '@/locales/fr/capex.json';
import frProph3t from '@/locales/fr/proph3t.json';

// English locale files
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enDashboard from '@/locales/en/dashboard.json';
import enAccounts from '@/locales/en/accounts.json';
import enBudget from '@/locales/en/budget.json';
import enForecast from '@/locales/en/forecast.json';
import enCashflow from '@/locales/en/cashflow.json';
import enCounterparties from '@/locales/en/counterparties.json';
import enSettings from '@/locales/en/settings.json';
import enReports from '@/locales/en/reports.json';
import enDisputes from '@/locales/en/disputes.json';
import enCapex from '@/locales/en/capex.json';
import enProph3t from '@/locales/en/proph3t.json';

const namespaces = [
  'common',
  'auth',
  'dashboard',
  'accounts',
  'budget',
  'forecast',
  'cashflow',
  'counterparties',
  'settings',
  'reports',
  'disputes',
  'capex',
  'proph3t',
] as const;

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: [...namespaces],
    supportedLngs: ['fr', 'en'],
    interpolation: {
      escapeValue: false,
    },
    resources: {
      fr: {
        common: frCommon,
        auth: frAuth,
        dashboard: frDashboard,
        accounts: frAccounts,
        budget: frBudget,
        forecast: frForecast,
        cashflow: frCashflow,
        counterparties: frCounterparties,
        settings: frSettings,
        reports: frReports,
        disputes: frDisputes,
        capex: frCapex,
        proph3t: frProph3t,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        accounts: enAccounts,
        budget: enBudget,
        forecast: enForecast,
        cashflow: enCashflow,
        counterparties: enCounterparties,
        settings: enSettings,
        reports: enReports,
        disputes: enDisputes,
        capex: enCapex,
        proph3t: enProph3t,
      },
    },
  });

export default i18n;
export { namespaces };

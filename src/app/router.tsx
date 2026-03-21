import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';

function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

// Auth
const AuthLayoutWrapper = lazy(() => import('@/components/layout/auth-layout'));
const RootLayoutWrapper = lazy(() => import('@/components/layout/root-layout'));
const LoginPage = lazy(() => import('@/features/auth/pages/login'));
const RegisterPage = lazy(() => import('@/features/auth/pages/register'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/forgot-password'));

// Home
const HomePage = lazy(() => import('@/features/home/pages/home'));

// Dashboard
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard'));

// Treasury / CashFlow
const ReceiptsPage = lazy(() => import('@/features/cashflow/pages/receipts'));
const DisbursementsPage = lazy(() => import('@/features/cashflow/pages/disbursements'));
const ForecastPage = lazy(() => import('@/features/forecast/pages/forecast'));
const AnnualForecastPage = lazy(() => import('@/features/forecast/pages/annual-forecast'));

// Accounts
const BankAccountsPage = lazy(() => import('@/features/bank-accounts/pages/bank-accounts'));
const BankAccountDetailPage = lazy(() => import('@/features/bank-accounts/pages/bank-account-detail'));
const CashRegistersPage = lazy(() => import('@/features/cash-registers/pages/cash-registers'));

// Management
const BudgetPage = lazy(() => import('@/features/budget/pages/budget'));
const CounterpartiesPage = lazy(() => import('@/features/counterparties/pages/counterparties'));
const TransfersPage = lazy(() => import('@/features/internal-transfers/pages/transfers'));

// Financing
const CapexPage = lazy(() => import('@/features/capex/pages/capex'));
const DebtPage = lazy(() => import('@/features/debt/pages/debt'));
const InvestmentsPage = lazy(() => import('@/features/investments/pages/investments'));
const CreditLinesPage = lazy(() => import('@/features/credit-lines/pages/credit-lines'));

// Risks
const DisputesPage = lazy(() => import('@/features/disputes/pages/disputes'));
const FiscalPage = lazy(() => import('@/features/fiscal/pages/fiscal'));

// Workflows
const PaymentWorkflowsPage = lazy(() => import('@/features/payment-workflows/pages/payment-workflows'));

// Proph3t Treasury Engine
const Proph3tForecastsPage = lazy(() => import('@/features/proph3t/pages/forecasts'));
const Proph3tAlertsPage = lazy(() => import('@/features/proph3t/pages/alerts'));
const Proph3tScoringPage = lazy(() => import('@/features/proph3t/pages/scoring'));
const Proph3tNarrativesPage = lazy(() => import('@/features/proph3t/pages/narratives'));
const Proph3tWhatIfPage = lazy(() => import('@/features/proph3t/pages/what-if'));
const Proph3tFraudPage = lazy(() => import('@/features/proph3t/pages/fraud'));
const Proph3tPerformancePage = lazy(() => import('@/features/proph3t/pages/performance'));

// Guide
const GuidePage = lazy(() => import('@/features/guide/pages/guide'));

// Admin
const ReportsPage = lazy(() => import('@/features/reporting/pages/reports'));
const AuditTrailPage = lazy(() => import('@/features/audit-trail/pages/audit-trail'));
const SettingsPage = lazy(() => import('@/features/settings/pages/settings'));
const ScenariosPage = lazy(() => import('@/features/scenarios/pages/scenarios'));
const ConsolidationPage = lazy(() => import('@/features/consolidation/pages/consolidation'));
const OpeningBalancePage = lazy(() => import('@/features/opening-balance/pages/opening-balance'));
const PrepaidCardsPage = lazy(() => import('@/features/prepaid-cards/pages/prepaid-cards'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  // Home — standalone, no sidebar/header
  {
    path: '/',
    element: <SuspenseWrapper><HomePage /></SuspenseWrapper>,
  },
  // App — with sidebar + header
  {
    path: '/',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <RootLayoutWrapper />
      </Suspense>
    ),
    children: [
      { path: 'dashboard', element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
      // Treasury
      { path: 'receipts', element: <SuspenseWrapper><ReceiptsPage /></SuspenseWrapper> },
      { path: 'disbursements', element: <SuspenseWrapper><DisbursementsPage /></SuspenseWrapper> },
      { path: 'forecast', element: <SuspenseWrapper><ForecastPage /></SuspenseWrapper> },
      { path: 'forecast/annual', element: <SuspenseWrapper><AnnualForecastPage /></SuspenseWrapper> },
      // Accounts
      { path: 'accounts', element: <SuspenseWrapper><BankAccountsPage /></SuspenseWrapper> },
      { path: 'accounts/:id', element: <SuspenseWrapper><BankAccountDetailPage /></SuspenseWrapper> },
      { path: 'cash-registers', element: <SuspenseWrapper><CashRegistersPage /></SuspenseWrapper> },
      // Management
      { path: 'budget', element: <SuspenseWrapper><BudgetPage /></SuspenseWrapper> },
      { path: 'counterparties', element: <SuspenseWrapper><CounterpartiesPage /></SuspenseWrapper> },
      { path: 'transfers', element: <SuspenseWrapper><TransfersPage /></SuspenseWrapper> },
      // Financing
      { path: 'capex', element: <SuspenseWrapper><CapexPage /></SuspenseWrapper> },
      { path: 'debt', element: <SuspenseWrapper><DebtPage /></SuspenseWrapper> },
      { path: 'investments', element: <SuspenseWrapper><InvestmentsPage /></SuspenseWrapper> },
      { path: 'credit-lines', element: <SuspenseWrapper><CreditLinesPage /></SuspenseWrapper> },
      // Risks
      { path: 'disputes', element: <SuspenseWrapper><DisputesPage /></SuspenseWrapper> },
      { path: 'fiscal', element: <SuspenseWrapper><FiscalPage /></SuspenseWrapper> },
      // Workflows
      { path: 'payment-workflows', element: <SuspenseWrapper><PaymentWorkflowsPage /></SuspenseWrapper> },
      // Proph3t Treasury Engine
      { path: 'proph3t/forecasts', element: <SuspenseWrapper><Proph3tForecastsPage /></SuspenseWrapper> },
      { path: 'proph3t/alerts', element: <SuspenseWrapper><Proph3tAlertsPage /></SuspenseWrapper> },
      { path: 'proph3t/scoring', element: <SuspenseWrapper><Proph3tScoringPage /></SuspenseWrapper> },
      { path: 'proph3t/narratives', element: <SuspenseWrapper><Proph3tNarrativesPage /></SuspenseWrapper> },
      { path: 'proph3t/what-if', element: <SuspenseWrapper><Proph3tWhatIfPage /></SuspenseWrapper> },
      { path: 'proph3t/fraud', element: <SuspenseWrapper><Proph3tFraudPage /></SuspenseWrapper> },
      { path: 'proph3t/performance', element: <SuspenseWrapper><Proph3tPerformancePage /></SuspenseWrapper> },
      // Admin
      { path: 'reports', element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
      { path: 'audit-trail', element: <SuspenseWrapper><AuditTrailPage /></SuspenseWrapper> },
      { path: 'settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
      { path: 'scenarios', element: <SuspenseWrapper><ScenariosPage /></SuspenseWrapper> },
      { path: 'consolidation', element: <SuspenseWrapper><ConsolidationPage /></SuspenseWrapper> },
      { path: 'opening-balance', element: <SuspenseWrapper><OpeningBalancePage /></SuspenseWrapper> },
      { path: 'prepaid-cards', element: <SuspenseWrapper><PrepaidCardsPage /></SuspenseWrapper> },
      // Guide
      { path: 'guide', element: <SuspenseWrapper><GuidePage /></SuspenseWrapper> },
    ],
  },
  {
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <AuthLayoutWrapper />
      </Suspense>
    ),
    children: [
      { path: 'login', element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
      { path: 'register', element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper> },
      { path: 'forgot-password', element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper> },
    ],
  },
]);

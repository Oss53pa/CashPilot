import { useCompanyStore } from '@/stores/company.store';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  useBankAccountsForBalance,
  useDefaultHeader,
  useBankOpeningBalances,
  useTaxOpeningBalance,
  useOpeningInvestments,
  useOpeningLoans,
  usePriorReceivables,
  usePriorPayables,
  useApprovalSteps,
  useSaveFullOpeningBalance,
} from '../hooks/use-opening-balance';
import { OpeningBalanceWizard } from '../components/opening-balance-wizard';

export default function OpeningBalancePage() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const { data: bankAccounts = [], isLoading: accountsLoading } =
    useBankAccountsForBalance(companyId);
  const { data: defaultHeader, isLoading: headerLoading } =
    useDefaultHeader(companyId);
  const { data: bankBalances = [], isLoading: bankBalancesLoading } =
    useBankOpeningBalances(companyId);
  const { data: taxBalance, isLoading: taxLoading } =
    useTaxOpeningBalance(companyId);
  const { data: investments = [], isLoading: investmentsLoading } =
    useOpeningInvestments(companyId);
  const { data: loans = [], isLoading: loansLoading } =
    useOpeningLoans(companyId);
  const { data: receivables = [], isLoading: receivablesLoading } =
    usePriorReceivables(companyId);
  const { data: payables = [], isLoading: payablesLoading } =
    usePriorPayables(companyId);
  const { data: approvalSteps = [], isLoading: approvalLoading } =
    useApprovalSteps(companyId);

  const saveFullBalance = useSaveFullOpeningBalance(companyId);

  const isLoading =
    accountsLoading ||
    headerLoading ||
    bankBalancesLoading ||
    taxLoading ||
    investmentsLoading ||
    loansLoading ||
    receivablesLoading ||
    payablesLoading ||
    approvalLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balance d'ouverture"
        description="Saisissez les soldes d'ouverture complets pour le démarrage de l'exercice fiscal. 9 sections couvrant trésorerie, fiscalité, placements, emprunts, créances et dettes."
      />

      <OpeningBalanceWizard
        bankAccounts={bankAccounts}
        initialHeader={defaultHeader}
        initialBankBalances={bankBalances}
        initialTaxBalance={taxBalance}
        initialInvestments={investments}
        initialLoans={loans}
        initialReceivables={receivables}
        initialPayables={payables}
        initialApprovalSteps={approvalSteps}
        onSubmit={(data) => saveFullBalance.mutate(data)}
        isPending={saveFullBalance.isPending}
      />
    </div>
  );
}

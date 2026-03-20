import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, ArrowLeft, Upload, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/shared/page-header';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';

import { useCompanyStore } from '@/stores/company.store';
import {
  useBankAccount,
  useUpdateBankAccount,
  useBankStatements,
} from '../hooks/use-bank-accounts';
import { BankAccountForm } from '../components/bank-account-form';
import { BankImport } from '../components/bank-import';
import { TransactionMatching } from '../components/transaction-matching';
import { BankAlerts } from '../components/bank-alerts';
import type { BankAccountFormData } from '../types';

export default function BankAccountDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentCompany = useCompanyStore((s) => s.currentCompany);

  const { data: account, isLoading } = useBankAccount(id);
  const updateMutation = useUpdateBankAccount();
  const { data: statements = [] } = useBankStatements(id);

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);

  const handleFormSubmit = async (data: BankAccountFormData) => {
    if (id) {
      await updateMutation.mutateAsync({ id, data });
      setFormOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('bankAccounts.notFound', 'Account not found')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back', 'Back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`${account.bank_name} - ${account.account_name}`}
          description={account.account_number}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('bankAccounts.import', 'Import')}
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit', 'Edit')}
            </Button>
          </div>
        </PageHeader>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            {t('bankAccounts.tabOverview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="imports">
            {t('bankAccounts.tabImports', 'Imports')}
            {statements.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {statements.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matching">
            {t('bankAccounts.tabMatching', 'Matching')}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            {t('bankAccounts.tabAlerts', 'Alerts')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('bankAccounts.accountInfo', 'Account Information')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('bankAccounts.bankName', 'Bank Name')}</span>
                  <span className="font-medium">{account.bank_name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('bankAccounts.accountNumber', 'Account Number')}</span>
                  <span className="font-mono">{account.account_number}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('bankAccounts.accountType', 'Type')}</span>
                  <Badge>{account.account_type.replace('_', ' ')}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('bankAccounts.currency', 'Currency')}</span>
                  <span>{account.currency}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('bankAccounts.status', 'Status')}</span>
                  <Badge variant={account.is_active ? 'default' : 'secondary'}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {account.iban && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IBAN</span>
                      <span className="font-mono text-sm">{account.iban}</span>
                    </div>
                  </>
                )}
                {account.swift_code && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SWIFT</span>
                      <span className="font-mono text-sm">{account.swift_code}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('bankAccounts.balance', 'Balance')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('bankAccounts.currentBalance', 'Current Balance')}</p>
                  <p className="text-3xl font-bold mt-1">
                    <CurrencyDisplay amount={account.current_balance} currency={account.currency} />
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">{t('bankAccounts.initialBalance', 'Initial Balance')}</p>
                  <p className="text-lg font-medium mt-1">
                    <CurrencyDisplay amount={account.initial_balance} currency={account.currency} />
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('bankAccounts.recentTransactions', 'Recent Transactions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  {t('bankAccounts.transactionsPlaceholder', 'Transaction history will appear here once cash flows are recorded.')}
                </p>
              </CardContent>
            </Card>

            {/* Balance Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('bankAccounts.balanceChart', 'Balance Evolution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  {t('bankAccounts.chartPlaceholder', 'Balance evolution chart will appear here once there is enough data.')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Imports Tab */}
        <TabsContent value="imports" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {t('bankAccounts.importHistory', 'Import History')}
            </h3>
            <Button onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('bankAccounts.newImport', 'New Import')}
            </Button>
          </div>

          {statements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {t('bankAccounts.noImports', 'No bank statements imported yet.')}
                </p>
                <Button className="mt-4" onClick={() => setImportOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('bankAccounts.importFirst', 'Import Your First Statement')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('bankAccounts.fileName', 'File')}</TableHead>
                      <TableHead>{t('bankAccounts.format', 'Format')}</TableHead>
                      <TableHead>{t('bankAccounts.period', 'Period')}</TableHead>
                      <TableHead>{t('bankAccounts.uploadDate', 'Uploaded')}</TableHead>
                      <TableHead className="text-center">{t('bankAccounts.transactions', 'Transactions')}</TableHead>
                      <TableHead className="text-center">{t('bankAccounts.matched', 'Matched')}</TableHead>
                      <TableHead className="text-center">{t('bankAccounts.unmatched', 'Unmatched')}</TableHead>
                      <TableHead>{t('bankAccounts.status', 'Status')}</TableHead>
                      <TableHead>{t('common.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statements.map((stmt) => (
                      <TableRow key={stmt.id}>
                        <TableCell className="text-sm font-mono">{stmt.file_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{stmt.format.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(stmt.period_start).toLocaleDateString('fr-FR')} -{' '}
                            {new Date(stmt.period_end).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(stmt.upload_date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-center">{stmt.transaction_count}</TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          {stmt.matched_count}
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-medium">
                          {stmt.unmatched_count}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={stmt.status} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStatementId(stmt.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Matching Tab */}
        <TabsContent value="matching">
          {selectedStatementId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {t('bankAccounts.transactionMatching', 'Transaction Matching')}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStatementId(null)}
                >
                  {t('bankAccounts.changeStatement', 'Change Statement')}
                </Button>
              </div>
              <TransactionMatching
                statementId={selectedStatementId}
                currency={account.currency}
              />
            </div>
          ) : statements.length > 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {t('bankAccounts.selectStatement', 'Select a statement to review matches')}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {statements.map((stmt) => (
                    <Button
                      key={stmt.id}
                      variant="outline"
                      onClick={() => setSelectedStatementId(stmt.id)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {stmt.file_name}
                      {stmt.unmatched_count > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {stmt.unmatched_count}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t('bankAccounts.importFirst', 'Import a bank statement first to start matching transactions.')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <BankAlerts accountId={id!} companyId={currentCompany?.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <BankAccountForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={account}
        loading={updateMutation.isPending}
      />

      {/* Import Dialog */}
      <BankImport
        open={importOpen}
        onOpenChange={setImportOpen}
        accountId={id!}
        bankName={account.bank_name}
        currency={account.currency}
      />
    </div>
  );
}

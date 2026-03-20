import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBudgets, useCreateBudget, useDeleteBudget } from '../hooks/use-budget';
import { getBudgetColumns } from '../components/budget-columns';
import { BudgetForm } from '../components/budget-form';
import { BudgetImport } from '../components/budget-import';
import { BudgetComparisonView } from '../components/budget-comparison';
import type { BudgetCreateInput, BudgetLineInput } from '../types';

export default function BudgetPage() {
  const { t } = useTranslation('budget');
  const navigate = useNavigate();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const { data: budgets = [] } = useBudgets(companyId);
  const createBudget = useCreateBudget(companyId);
  const deleteBudget = useDeleteBudget(companyId);

  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  function handleCreate(data: BudgetCreateInput) {
    createBudget.mutate(data);
  }

  function handleDelete(budget: { id: string }) {
    deleteBudget.mutate(budget.id);
  }

  function handleImport(lines: BudgetLineInput[]) {
    // In real use, would upsert lines to a selected budget
    console.log('Imported lines:', lines);
  }

  const columns = useMemo(
    () =>
      getBudgetColumns({
        onEdit: (budget) => navigate(`/budgets/${budget.id}`),
        onDelete: handleDelete,
        currency: currentCompany?.currency,
      }),
    [currentCompany?.currency]
  );

  const budgetOptions = budgets.map((b: Record<string, unknown>) => ({
    id: b.id as string,
    name: b.name as string,
    fiscal_year: b.fiscal_year as number,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', 'Budgets')}
        description={t('description', 'Manage your annual budgets and forecasts.')}
      >
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('create', 'Create Budget')}
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">
            {t('tabs.list', 'Budgets')}
          </TabsTrigger>
          <TabsTrigger value="import">
            {t('tabs.import', 'Import')}
          </TabsTrigger>
          <TabsTrigger value="comparison">
            {t('tabs.comparison', 'Comparison')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <DataTable
            columns={columns}
            data={budgets}
            searchKey="name"
            searchPlaceholder={t('search', 'Search budgets...')}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <BudgetImport onImport={handleImport} />
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          <BudgetComparisonView budgets={budgetOptions} />
        </TabsContent>
      </Tabs>

      <BudgetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isPending={createBudget.isPending}
      />
    </div>
  );
}

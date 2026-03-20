import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { Counterparty } from '@/types/database';
import { useCompanyStore } from '@/stores/company.store';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  useCounterparties,
  useCreateCounterparty,
  useDeleteCounterparty,
} from '../hooks/use-counterparties';
import { getCounterpartyColumns } from '../components/counterparty-columns';
import { CounterpartyForm } from '../components/counterparty-form';
import { CounterpartyProfile } from '../components/counterparty-profile';
import type { CounterpartyInput } from '../types';

export default function CounterpartiesPage() {
  const { t } = useTranslation('counterparties');
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const { data: counterparties = [] } = useCounterparties(companyId);
  const createCounterparty = useCreateCounterparty(companyId);
  const deleteCounterparty = useDeleteCounterparty(companyId);

  const [formOpen, setFormOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] = useState<Counterparty | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const filteredData = useMemo(() => {
    if (activeTab === 'all') return counterparties;
    if (activeTab === 'customers') return counterparties.filter((c) => c.type === 'customer');
    if (activeTab === 'suppliers') return counterparties.filter((c) => c.type === 'supplier');
    return counterparties.filter((c) => !['customer', 'supplier'].includes(c.type));
  }, [counterparties, activeTab]);

  function handleCreate(data: CounterpartyInput) {
    createCounterparty.mutate(data);
  }

  function handleDelete(counterparty: Counterparty) {
    deleteCounterparty.mutate(counterparty.id);
  }

  function handleView(counterparty: Counterparty) {
    setSelectedCounterparty(counterparty);
    setProfileOpen(true);
  }

  const columns = useMemo(
    () =>
      getCounterpartyColumns({
        onEdit: (cp) => {
          setSelectedCounterparty(cp);
          setFormOpen(true);
        },
        onDelete: handleDelete,
        onView: handleView,
      }),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', 'Counterparties')}
        description={t('description', 'Manage your customers, suppliers, and other counterparties.')}
      >
        <Button onClick={() => { setSelectedCounterparty(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t('add', 'Add Counterparty')}
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all', 'All')}</TabsTrigger>
          <TabsTrigger value="customers">{t('tabs.customers', 'Customers')}</TabsTrigger>
          <TabsTrigger value="suppliers">{t('tabs.suppliers', 'Suppliers')}</TabsTrigger>
          <TabsTrigger value="others">{t('tabs.others', 'Others')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            columns={columns}
            data={filteredData}
            searchKey="name"
            searchPlaceholder={t('search', 'Search counterparties...')}
          />
        </TabsContent>
      </Tabs>

      <CounterpartyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        defaultValues={selectedCounterparty ? {
          name: selectedCounterparty.name,
          short_name: selectedCounterparty.short_name,
          type: selectedCounterparty.type,
          tax_id: selectedCounterparty.tax_id,
          email: selectedCounterparty.email,
          phone: selectedCounterparty.phone,
          address: selectedCounterparty.address,
          payment_terms: selectedCounterparty.payment_terms,
          is_active: selectedCounterparty.is_active,
        } : undefined}
        isPending={createCounterparty.isPending}
      />

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
          {selectedCounterparty && (
            <CounterpartyProfile
              counterparty={selectedCounterparty}
              companyId={companyId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import { useCompanyStore } from '@/stores/company.store';
import {
  usePrepaidCards,
  useCreatePrepaidCard,
  useUpdatePrepaidCard,
  useDeletePrepaidCard,
} from '../hooks/use-prepaid-cards';
import { getPrepaidCardColumns } from '../components/prepaid-card-columns';
import { PrepaidCardForm } from '../components/prepaid-card-form';
import { GiftCardLiabilityCard } from '../components/gift-card-liability';
import type { PrepaidCard, PrepaidCardFormData } from '../types';

export default function PrepaidCardsPage() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data: cards = [], isLoading } = usePrepaidCards(companyId);

  const createMutation = useCreatePrepaidCard();
  const updateMutation = useUpdatePrepaidCard();
  const deleteMutation = useDeletePrepaidCard();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PrepaidCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrepaidCard | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const columns = useMemo(
    () =>
      getPrepaidCardColumns({
        onEdit: (item) => {
          setEditingItem(item);
          setFormOpen(true);
        },
        onDelete: (item) => {
          setDeleteTarget(item);
        },
      }),
    [],
  );

  const filteredCards = useMemo(() => {
    if (activeTab === 'all') return cards;
    return cards.filter((card) => card.type === activeTab);
  }, [cards, activeTab]);

  const handleFormSubmit = async (data: PrepaidCardFormData) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, data });
    } else if (companyId) {
      await createMutation.mutateAsync({ companyId, data });
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('prepaidCards.title', 'Prepaid Cards')}
        description={t('prepaidCards.description', 'Manage your prepaid and corporate cards')}
      >
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('prepaidCards.addCard', 'Add Card')}
        </Button>
      </PageHeader>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            {t('prepaidCards.all', 'All')} ({cards.length})
          </TabsTrigger>
          <TabsTrigger value="corporate">
            {t('prepaidCards.corporate', 'Corporate')} ({cards.filter((c) => c.type === 'corporate').length})
          </TabsTrigger>
          <TabsTrigger value="gift">
            {t('prepaidCards.gift', 'Gift')} ({cards.filter((c) => c.type === 'gift').length})
          </TabsTrigger>
          <TabsTrigger value="travel">
            {t('prepaidCards.travel', 'Travel')} ({cards.filter((c) => c.type === 'travel').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {/* Gift Card Liability - shown on gift tab */}
          {activeTab === 'gift' && <GiftCardLiabilityCard />}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCards}
              searchKey="holder_name"
              searchPlaceholder={t('prepaidCards.searchPlaceholder', 'Search cards...')}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <PrepaidCardForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        defaultValues={editingItem}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('prepaidCards.deleteTitle', 'Delete Prepaid Card')}
        description={t(
          'prepaidCards.deleteDescription',
          `Are you sure you want to delete the card for "${deleteTarget?.holder_name}"? This action cannot be undone.`,
        )}
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

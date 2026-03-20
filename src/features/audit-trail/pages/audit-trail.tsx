import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyStore } from '@/stores/company.store';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuditLogs } from '../hooks/use-audit-trail';
import { getAuditLogColumns } from '../components/audit-log-columns';
import { AuditLogFiltersBar } from '../components/audit-log-filters';
import { PeriodClosing } from '../components/period-closing';
import { ReconciliationView } from '../components/reconciliation-view';
import type { AuditLogFilters } from '../services/audit-trail.service';

export default function AuditTrailPage() {
  const { t } = useTranslation('audit-trail');
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const [filters, setFilters] = useState<AuditLogFilters>({});
  const { data: logs = [] } = useAuditLogs(companyId, filters);

  const columns = getAuditLogColumns();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', 'Audit Trail')}
        description={t(
          'description',
          'View all activity, period closing status, and inter-module reconciliation.'
        )}
      />

      <Tabs defaultValue="audit-log" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit-log">
            {t('tab_audit_log', 'Audit Log')}
          </TabsTrigger>
          <TabsTrigger value="period-closing">
            {t('tab_period_closing', 'Period Closing')}
          </TabsTrigger>
          <TabsTrigger value="reconciliation">
            {t('tab_reconciliation', 'Reconciliation')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit-log" className="space-y-4">
          <AuditLogFiltersBar filters={filters} onFiltersChange={setFilters} />
          <DataTable
            columns={columns}
            data={logs}
            searchKey="action"
            searchPlaceholder={t('search', 'Search logs...')}
            pageSize={20}
          />
        </TabsContent>

        <TabsContent value="period-closing">
          <PeriodClosing />
        </TabsContent>

        <TabsContent value="reconciliation">
          <ReconciliationView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
